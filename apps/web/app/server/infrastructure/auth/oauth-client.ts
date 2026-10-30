import { JoseKey } from "@atproto/jwk-jose";
import { Client } from "@atproto/lex";
import {
  NodeOAuthClient,
  type NodeSavedSessionStore,
  type NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import type { ILoggerManager } from "@repo/common/domain";

import { env, isProduction } from "@/app/server/env";

const scope = "atproto transition:generic";
const redirectUri = `${env.PUBLIC_URL}/oauth/callback`;

const clientMetadata = isProduction
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

const keyset = isProduction
  ? [
      await JoseKey.fromImportable(
        Buffer.from(env.PRIVATE_KEY_ES256_B64, "base64").toString(),
        "key1",
      ),
    ]
  : undefined;

export interface IOAuthClient {
  authorize: (identifier: string) => Promise<string>;
  callback: (params: URLSearchParams) => Promise<Client>;
  restore: (did: string) => Promise<Client | null>;
  clientMetadata: object;
  jwks: NodeOAuthClient["jwks"];
}

export const oauthClientFactory = ({
  oauthStateStore,
  oauthSessionStore,
  loggerManager,
}: {
  oauthStateStore: NodeSavedStateStore;
  oauthSessionStore: NodeSavedSessionStore;
  loggerManager: ILoggerManager;
}): IOAuthClient => {
  const client = new NodeOAuthClient({
    clientMetadata,
    keyset,
    allowHttp: !isProduction,
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    handleResolver: env.ATPROTO_HANDLE_RESOLVER_URL,
    stateStore: oauthStateStore,
    sessionStore: oauthSessionStore,
  });
  const logger = loggerManager.createLogger("oauthClient");

  const createAgent = (session: ConstructorParameters<typeof Client>[0]) =>
    new Client(session, { service: `${env.APPVIEW_DID}#bsky_appview` });

  return {
    async authorize(identifier) {
      const url = await client.authorize(identifier);
      return url.toString();
    },
    async callback(params) {
      const { session } = await client.callback(params);
      return createAgent(session);
    },
    async restore(did) {
      try {
        return createAgent(await client.restore(did));
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
