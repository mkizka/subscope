import type { TransactionContext } from "@repo/common/domain";

import type { ListItemRow } from "../../record-parsers.js";

export interface IListItemRepository {
  save: (params: {
    ctx: TransactionContext;
    listItem: ListItemRow;
  }) => Promise<void>;
}
