import type { Client } from "@atproto/lex";
import type { NodeOAuthClient } from "@atproto/oauth-client-node";

export interface IOAuthClient {
  authorize: (identifier: string) => Promise<string>;
  callback: (params: URLSearchParams) => Promise<Client>;
  restore: (did: string) => Promise<Client | null>;
  getAccountUrl: (did: string) => Promise<string | null>;
  clientMetadata: object;
  jwks: NodeOAuthClient["jwks"];
}
