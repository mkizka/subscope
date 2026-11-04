import type { TransactionContext } from "@repo/common/domain";

import type { List } from "../../models/list.js";

export interface IListRepository {
  save: (params: { ctx: TransactionContext; list: List }) => Promise<void>;
}
