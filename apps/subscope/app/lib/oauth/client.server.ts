import { JoseKey } from "@atproto/jwk-jose";
import { NodeOAuthClient } from "@atproto/oauth-client-node";

import { env } from "@/server/shared/env.js";

import { sessionStore, stateStore } from "./storage.server.js";

const privateKey = Buffer.from(env.PRIVATE_KEY_ES256_B64, "base64").toString();
const joseKey = await JoseKey.fromImportable(privateKey, "key1");

export const oauthClient = new NodeOAuthClient({
  clientMetadata: {
    client_name: "Subscope",
    client_id: `${env.PUBLIC_URL}/oauth/client-metadata.json`,
    client_uri: env.PUBLIC_URL,
    jwks_uri: `${env.PUBLIC_URL}/oauth/jwks.json`,
    redirect_uris: [`${env.PUBLIC_URL}/oauth/callback`],
    scope: "atproto transition:generic",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    token_endpoint_auth_method: "private_key_jwt",
    token_endpoint_auth_signing_alg: "ES256",
    dpop_bound_access_tokens: true,
  },
  keyset: [joseKey],
  plcDirectoryUrl: env.ATPROTO_PLC_URL,
  stateStore,
  sessionStore,
});
