import type { Did } from "@atproto/did";
import type { Actor, TransactionContext } from "@repo/common/domain";

export type BackfillStatus = "inProgress" | "completed" | "error";

export interface IActorRepository {
  save: (params: { ctx: TransactionContext; actor: Actor }) => Promise<void>;

  find: (params: {
    ctx: TransactionContext;
    did: Did;
  }) => Promise<Actor | null>;

  exists: (params: { ctx: TransactionContext; did: Did }) => Promise<boolean>;

  delete: (params: { ctx: TransactionContext; did: Did }) => Promise<void>;

  updateBackfillStatus: (params: {
    ctx: TransactionContext;
    did: Did;
    status: BackfillStatus;
  }) => Promise<void>;

  findTrackedDidsWithoutBackfillStatus: (
    ctx: TransactionContext,
  ) => Promise<Did[]>;
}
