import type { TransactionContext } from "@repo/common/domain";

import type { ListRow } from "../../record-parsers.js";

export interface IListRepository {
  save: (params: { ctx: TransactionContext; list: ListRow }) => Promise<void>;
}
