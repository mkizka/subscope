import { JoseKey } from "@atproto/jwk-jose";
import { NodeOAuthClient } from "@atproto/oauth-client-node";

import { env, isProduction } from "@/app/shared/env.js";

import { sessionStore, stateStore } from "./storage.server.js";

const scope = "atproto transition:generic";
const redirectUri = `${env.PUBLIC_URL}/oauth/callback`;

const privateKey = Buffer.from(env.PRIVATE_KEY_ES256_B64, "base64").toString();

export const oauthClient = new NodeOAuthClient({
  clientMetadata: isProduction
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
      },
  keyset: isProduction
    ? [await JoseKey.fromImportable(privateKey, "key1")]
    : undefined,
  allowHttp: !isProduction,
  plcDirectoryUrl: env.ATPROTO_PLC_URL,
  handleResolver: env.ATPROTO_HANDLE_RESOLVER_URL,
  stateStore,
  sessionStore,
});
