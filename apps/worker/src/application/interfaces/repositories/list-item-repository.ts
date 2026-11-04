import type { TransactionContext } from "@repo/common/domain";

import type { ListItem } from "../../models/list-item.js";

export interface IListItemRepository {
  save: (params: {
    ctx: TransactionContext;
    listItem: ListItem;
  }) => Promise<void>;
}
