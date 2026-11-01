import type { Did } from "@atproto/did";
import type { Actor, TransactionContext } from "@repo/common/domain";

export type BackfillStatus = "inProgress" | "completed" | "error";

export interface IActorRepository {
  findByDid: (did: Did) => Promise<Actor | null>;
  upsert: (params: { ctx: TransactionContext; actor: Actor }) => Promise<void>;
  hasAnyAdmin: () => Promise<boolean>;
  findBannedDids: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Did[]>;
  findBackfillStatusesWithFollows: (
    dids: Did[],
  ) => Promise<Map<Did, BackfillStatus>>;
}
