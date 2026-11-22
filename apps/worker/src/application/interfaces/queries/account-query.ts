import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

export interface IAccountQuery {
  exists: (params: { ctx: TransactionContext; did: Did }) => Promise<boolean>;

  findTrackedDidsWithoutBackfillStatus: (
    ctx: TransactionContext,
  ) => Promise<Did[]>;
}
