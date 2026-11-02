import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

export interface IAccountQuery {
  exists: (params: { ctx: TransactionContext; did: Did }) => Promise<boolean>;

  findTrackedDidsWithoutBackfillStatus: (
    ctx: TransactionContext,
  ) => Promise<Did[]>;
}
