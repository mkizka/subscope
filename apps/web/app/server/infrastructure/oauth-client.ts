import { JoseKey } from "@atproto/jwk-jose";
import { Client } from "@atproto/lex";
import { NodeOAuthClient } from "@atproto/oauth-client-node";
import type { DidString } from "@atproto/syntax";
import type { DatabaseClient, ILoggerManager } from "@repo/common/domain";

import { OAuthSessionStore, OAuthStateStore } from "./oauth-store.js";

export class OAuthClient {
  constructor(
    private readonly client: NodeOAuthClient,
    private readonly appviewDid: DidString,
    private readonly loggerManager: ILoggerManager,
  ) {}

  get clientMetadata(): object {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.client.clientMetadata;
  }

  get jwks(): object {
    return this.client.jwks;
  }

  async authorize(identifier: string) {
    const url = await this.client.authorize(identifier);
    return url.toString();
  }

  async callback(params: URLSearchParams) {
    const { session } = await this.client.callback(params);
    return this.createAgent(session);
  }

  async restore(did: string) {
    try {
      return this.createAgent(await this.client.restore(did));
    } catch (e) {
      this.loggerManager
        .createLogger("OAuthClient")
        .warn(e, "Failed to restore OAuth session");
      return null;
    }
  }

  private createAgent(session: ConstructorParameters<typeof Client>[0]) {
    return new Client(session, {
      service: `${this.appviewDid}#bsky_appview`,
    });
  }
}

export const createOAuthClient = async (
  publicUrl: string,
  privateKeyB64: string,
  isProduction: boolean,
  plcUrl: string,
  handleResolverUrl: string | undefined,
  appviewDid: DidString,
  db: DatabaseClient,
  loggerManager: ILoggerManager,
) => {
  const scope = "atproto transition:generic";
  const redirectUri = `${publicUrl}/oauth/callback`;
  const privateKey = Buffer.from(privateKeyB64, "base64").toString();
  const client = new NodeOAuthClient({
    clientMetadata: isProduction
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
        },
    keyset: isProduction
      ? [await JoseKey.fromImportable(privateKey, "key1")]
      : undefined,
    allowHttp: !isProduction,
    plcDirectoryUrl: plcUrl,
    handleResolver: handleResolverUrl,
    stateStore: new OAuthStateStore(db),
    sessionStore: new OAuthSessionStore(db),
  });
  return new OAuthClient(client, appviewDid, loggerManager);
};
