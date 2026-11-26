import type { TransactionContext } from "@repo/common/interface";

import type { ListItem } from "../../../domain/list-item.js";

export interface IListItemRepository {
  save: (params: {
    ctx: TransactionContext;
    listItem: ListItem;
  }) => Promise<void>;
}
