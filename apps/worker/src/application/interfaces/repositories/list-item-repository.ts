import type { TransactionContext } from "@repo/common/interface";

import type { ListItem } from "../../dto/list-item.js";

export interface IListItemRepository {
  save: (params: {
    ctx: TransactionContext;
    listItem: ListItem;
  }) => Promise<void>;
}
