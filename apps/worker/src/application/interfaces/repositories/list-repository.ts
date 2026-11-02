import type { List, TransactionContext } from "@repo/common/domain";

export interface IListRepository {
  save: (params: { ctx: TransactionContext; list: List }) => Promise<void>;
}
