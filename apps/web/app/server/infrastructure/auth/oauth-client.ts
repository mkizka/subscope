import { JoseKey } from "@atproto/jwk-jose";
import { Client } from "@atproto/lex";
import {
  NodeOAuthClient,
  type NodeSavedSessionStore,
  type NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import type { ILoggerManager } from "@repo/common/interface";
import { z } from "zodV4";

import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import type { Env } from "@/app/server/env";

const rpcMethods = [
  "app.bsky.actor.getProfile",
  "app.bsky.actor.getProfiles",
  "app.bsky.actor.searchActors",
  "app.bsky.actor.searchActorsTypeahead",
  "app.bsky.feed.getActorLikes",
  "app.bsky.feed.getAuthorFeed",
  "app.bsky.feed.getListFeed",
  "app.bsky.feed.getPosts",
  "app.bsky.feed.getPostThread",
  "app.bsky.feed.getTimeline",
  "app.bsky.feed.searchPosts",
  "app.bsky.graph.getFollowers",
  "app.bsky.graph.getFollows",
  "app.bsky.graph.getList",
  "app.bsky.graph.getLists",
  "app.bsky.notification.getUnreadCount",
  "app.bsky.notification.listNotifications",
  "app.bsky.notification.updateSeen",
  "me.subsco.admin.banAccount",
  "me.subsco.admin.createInviteCode",
  "me.subsco.admin.deleteInviteCode",
  "me.subsco.admin.getBannedAccounts",
  "me.subsco.admin.getInviteCodes",
  "me.subsco.admin.grantAdmin",
  "me.subsco.admin.listServerMembers",
  "me.subsco.admin.registerAdmin",
  "me.subsco.admin.unbanAccount",
  "me.subsco.admin.verifyAccess",
  "me.subsco.server.getFollowedAccounts",
  "me.subsco.server.getLocalTimeline",
  "me.subsco.sync.getRegistrationStatus",
  "me.subsco.sync.registerAccount",
];

const issuerSchema = z.object({ issuer: z.string() });

export const oauthClientFactory = async ({
  oauthStateStore,
  oauthSessionStore,
  loggerManager,
  env,
}: {
  oauthStateStore: NodeSavedStateStore;
  oauthSessionStore: NodeSavedSessionStore;
  loggerManager: ILoggerManager;
  env: Pick<
    Env,
    | "isProduction"
    | "PUBLIC_URL"
    | "APPVIEW_DID"
    | "PRIVATE_KEY_ES256_B64"
    | "ATPROTO_PLC_URL"
    | "ATPROTO_HANDLE_RESOLVER_URL"
  >;
}): Promise<IOAuthClient> => {
  const rpcParams = new URLSearchParams([
    ...rpcMethods.map((lxm) => ["lxm", lxm]),
    ["aud", `${env.APPVIEW_DID}#bsky_appview`],
  ]);
  const scope = [
    "atproto",
    "repo?collection=app.bsky.feed.post&collection=app.bsky.feed.threadgate&collection=app.bsky.feed.like&collection=app.bsky.feed.repost&collection=app.bsky.graph.follow&collection=app.bsky.graph.listitem&action=create&action=delete",
    "repo:app.bsky.graph.list",
    "blob:image/*",
    `rpc?${rpcParams}`,
  ].join(" ");
  const redirectUri = `${env.PUBLIC_URL}/oauth/callback`;

  const clientMetadata = env.isProduction
    ? {
        client_name: "Subscope",
        client_id: `${env.PUBLIC_URL}/oauth/client-metadata.json`,
        client_uri: env.PUBLIC_URL,
        jwks_uri: `${env.PUBLIC_URL}/oauth/jwks.json`,
        redirect_uris: [redirectUri],
        scope,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "web",
        token_endpoint_auth_method: "private_key_jwt",
        token_endpoint_auth_signing_alg: "ES256",
        dpop_bound_access_tokens: true,
      }
    : {
        client_id: `http://localhost?${new URLSearchParams({ redirect_uri: redirectUri, scope })}`,
        redirect_uris: [redirectUri],
        scope,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "native",
        token_endpoint_auth_method: "none",
        dpop_bound_access_tokens: true,
      };

  const keyset = env.isProduction
    ? [
        await JoseKey.fromImportable(
          Buffer.from(env.PRIVATE_KEY_ES256_B64, "base64").toString(),
          "key1",
        ),
      ]
    : undefined;

  const client = new NodeOAuthClient({
    clientMetadata,
    keyset,
    allowHttp: !env.isProduction,
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    handleResolver: env.ATPROTO_HANDLE_RESOLVER_URL,
    stateStore: oauthStateStore,
    sessionStore: oauthSessionStore,
  });
  const logger = loggerManager.createLogger("oauthClient");

  const createAgent = (session: ConstructorParameters<typeof Client>[0]) =>
    new Client(session, { service: `${env.APPVIEW_DID}#bsky_appview` });

  return {
    async authorize(identifier, state) {
      const url = await client.authorize(identifier, { state });
      return url.toString();
    },
    async callback(params) {
      const { session, state } = await client.callback(params);
      return { client: createAgent(session), state };
    },
    async restore(did) {
      try {
        return createAgent(await client.restore(did));
      } catch (e) {
        logger.warn(e, "Failed to restore OAuth session");
        return null;
      }
    },
    async getAccountUrl(did) {
      try {
        const session = await client.restore(did);
        const { issuer } = issuerSchema.parse(session.serverMetadata);
        return `${issuer}/account`;
      } catch (e) {
        logger.warn(e, "Failed to restore OAuth session");
        return null;
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    clientMetadata: client.clientMetadata,
    jwks: client.jwks,
  };
};
