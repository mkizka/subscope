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

const issuerSchema = z.object({ issuer: z.string() });

export const oauthClientFactory = async ({
  oauthStateStore,
  oauthSessionStore,
  loggerManager,
  isProduction,
  publicUrl,
  appviewDid,
  privateKeyEs256B64,
  atprotoPlcUrl,
  atprotoHandleResolverUrl,
}: {
  oauthStateStore: NodeSavedStateStore;
  oauthSessionStore: NodeSavedSessionStore;
  loggerManager: ILoggerManager;
  isProduction: boolean;
  publicUrl: string;
  appviewDid: `did:${string}:${string}`;
  privateKeyEs256B64: string;
  atprotoPlcUrl: string;
  atprotoHandleResolverUrl: string | undefined;
}): Promise<IOAuthClient> => {
  const appviewAud = encodeURIComponent(`${appviewDid}#bsky_appview`);
  const scope = [
    "atproto",
    "repo?collection=app.bsky.feed.post&collection=app.bsky.feed.threadgate&collection=app.bsky.feed.like&collection=app.bsky.feed.repost&collection=app.bsky.graph.follow&collection=app.bsky.graph.listitem&action=create&action=delete",
    "repo:app.bsky.graph.list",
    "blob:image/*",
    `rpc:*?aud=${appviewAud}`,
  ].join(" ");
  const redirectUri = `${publicUrl}/oauth/callback`;

  const clientMetadata = isProduction
    ? {
        client_name: "Subscope",
        client_id: `${publicUrl}/oauth/client-metadata.json`,
        client_uri: publicUrl,
        jwks_uri: `${publicUrl}/oauth/jwks.json`,
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

  const keyset = isProduction
    ? [
        await JoseKey.fromImportable(
          Buffer.from(privateKeyEs256B64, "base64").toString(),
          "key1",
        ),
      ]
    : undefined;

  const client = new NodeOAuthClient({
    clientMetadata,
    keyset,
    allowHttp: !isProduction,
    plcDirectoryUrl: atprotoPlcUrl,
    handleResolver: atprotoHandleResolverUrl,
    stateStore: oauthStateStore,
    sessionStore: oauthSessionStore,
  });
  const logger = loggerManager.createLogger("oauthClient");

  const createAgent = (session: ConstructorParameters<typeof Client>[0]) =>
    new Client(session, { service: `${appviewDid}#bsky_appview` });

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
