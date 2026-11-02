import type { Did } from "@atproto/did";

export interface IActorQuery {
  hasAnyAdmin: () => Promise<boolean>;
  findBannedDids: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Did[]>;
}
