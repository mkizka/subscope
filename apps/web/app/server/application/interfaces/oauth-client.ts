import type { Client } from "@atproto/lex";
import type { NodeOAuthClient } from "@atproto/oauth-client-node";

export interface IOAuthClient {
  authorize: (identifier: string, state?: string) => Promise<string>;
  callback: (
    params: URLSearchParams,
  ) => Promise<{ client: Client; state: string | null }>;
  restore: (did: string) => Promise<Client | null>;
  getAccountUrl: (did: string) => Promise<string | null>;
  clientMetadata: object;
  jwks: NodeOAuthClient["jwks"];
}
