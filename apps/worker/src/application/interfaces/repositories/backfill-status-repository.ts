import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

export type BackfillStatus = "inProgress" | "completed" | "error";

export interface IBackfillStatusRepository {
  save: (params: {
    ctx: TransactionContext;
    did: Did;
    status: BackfillStatus;
  }) => Promise<void>;
  findUncheckedTrackedDids: (ctx: TransactionContext) => Promise<Did[]>;
}
