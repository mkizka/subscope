import type { Did } from "@atproto/did";

export interface IAccountQuery {
  hasAnyAdmin: () => Promise<boolean>;
  findRepoRev: (did: Did) => Promise<string | null>;
  findBannedDids: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Did[]>;
}
