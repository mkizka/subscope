import type { Did } from "@atproto/did";

export interface IAccountQuery {
  hasAnyAdmin: () => Promise<boolean>;
  findBannedDids: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Did[]>;
}
