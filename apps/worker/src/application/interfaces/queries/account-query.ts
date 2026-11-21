import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

export interface IAccountQuery {
  exists: (params: { ctx: TransactionContext; did: Did }) => Promise<boolean>;

  findTrackedAt: (params: {
    ctx: TransactionContext;
    did: Did;
  }) => Promise<Date | null>;

  findTrackedDidsWithoutBackfillStatus: (
    ctx: TransactionContext,
  ) => Promise<Did[]>;
}
