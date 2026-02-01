import { JoseKey } from "@atproto/jwk-jose";
import type {
  NodeSavedSessionStore,
  NodeSavedStateStore,
  OAuthClientMetadataInput,
} from "@atproto/oauth-client-node";
import { atprotoLoopbackClientMetadata } from "@atproto/oauth-client-node";
import { NodeOAuthClient } from "@atproto/oauth-client-node";

import { env, isProduction } from "../../shared/env.js";

const privateKey = Buffer.from(env.PRIVATE_KEY_ES256_B64, "base64").toString();
const joseKey = await JoseKey.fromImportable(privateKey, "key1");

export const oauthClientFactory = (
  oauthStateStore: NodeSavedStateStore,
  oauthSessionStore: NodeSavedSessionStore,
) => {
  const scope = "atproto transition:generic";

  const clientMetadata: OAuthClientMetadataInput = isProduction
    ? {
        client_name: "Subscope",
        client_id: `${env.PUBLIC_URL}/oauth/client-metadata.json`,
        client_uri: env.PUBLIC_URL,
        jwks_uri: `${env.PUBLIC_URL}/oauth/jwks.json`,
        redirect_uris: [`${env.PUBLIC_URL}/oauth/callback`],
        scope,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "web",
        token_endpoint_auth_method: "private_key_jwt",
        token_endpoint_auth_signing_alg: "ES256",
        dpop_bound_access_tokens: true,
      }
    : atprotoLoopbackClientMetadata(
        `http://localhost?${new URLSearchParams([
          ["redirect_uri", `http://127.0.0.1:${env.PORT}/oauth/callback`],
          ["scope", scope],
        ]).toString()}`,
      );
  const keyset = isProduction ? [joseKey] : undefined;

  return new NodeOAuthClient({
    clientMetadata: clientMetadata,
    keyset,
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    stateStore: oauthStateStore,
    sessionStore: oauthSessionStore,
  });
};
oauthClientFactory.inject = ["oauthStateStore", "oauthSessionStore"] as const;
