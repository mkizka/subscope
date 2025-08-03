import { JoseKey } from "@atproto/jwk-jose";
import type { NodeOAuthClientOptions } from "@atproto/oauth-client-node";
import { NodeOAuthClient } from "@atproto/oauth-client-node";

import { env, isProduction } from "../env";
import { injector } from "../injector";
import { SessionStore, StateStore } from "./storage";

const baseUrl = isProduction ? env.PUBLIC_URL : "http://127.0.0.1:3000";
const redirectUri = `${baseUrl}/oauth-callback`;
const scope = "atproto transition:generic";

const privateKey = Buffer.from(env.PRIVATE_KEY_ES256_B64, "base64").toString();

const oauthClientOptions: NodeOAuthClientOptions = {
  clientMetadata: {
    client_name: "Linkat",
    client_id: `${env.PUBLIC_URL}/client-metadata.json`,
    client_uri: baseUrl,
    jwks_uri: `${baseUrl}/jwks.json`,
    redirect_uris: [redirectUri],
    scope,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    token_endpoint_auth_method: "private_key_jwt",
    token_endpoint_auth_signing_alg: "ES256",
    dpop_bound_access_tokens: true,
  },
  keyset: [await JoseKey.fromImportable(privateKey, "key1")],
  plcDirectoryUrl: env.ATPROTO_PLC_URL,
  stateStore: injector.injectClass(StateStore),
  sessionStore: injector.injectClass(SessionStore),
};

if (!isProduction) {
  // https://atproto.com/ja/specs/oauth#localhost-client-development
  const localClientId = new URL("http://localhost");
  localClientId.searchParams.set("redirect_uri", redirectUri);
  localClientId.searchParams.set("scope", scope);

  oauthClientOptions.clientMetadata = {
    ...oauthClientOptions.clientMetadata,
    client_id: localClientId.toString(),
  };
  oauthClientOptions.handleResolver = "http://localhost:2583";
  oauthClientOptions.allowHttp = true; // httpを許可しないとOAuthProtectedResourceMetadataResolverがエラーを投げる
}

export const oauthClient = new NodeOAuthClient(oauthClientOptions);
