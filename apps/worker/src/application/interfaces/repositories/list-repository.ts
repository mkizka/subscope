import type { TransactionContext } from "@repo/common/interface";

import type { List } from "../../dto/list.js";

export interface IListRepository {
  save: (params: { ctx: TransactionContext; list: List }) => Promise<void>;
}
