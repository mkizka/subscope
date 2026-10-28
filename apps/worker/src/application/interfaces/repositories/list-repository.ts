import type { List, TransactionContext } from "@repo/common/domain";

export interface IListRepository {
  upsert: (params: { ctx: TransactionContext; list: List }) => Promise<void>;
}
