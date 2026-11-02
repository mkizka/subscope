import type { ListItem, TransactionContext } from "@repo/common/domain";

export interface IListItemRepository {
  save: (params: {
    ctx: TransactionContext;
    listItem: ListItem;
  }) => Promise<void>;
}
