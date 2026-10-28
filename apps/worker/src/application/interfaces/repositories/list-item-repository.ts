import type { ListItem, TransactionContext } from "@repo/common/domain";

export interface IListItemRepository {
  upsert: (params: {
    ctx: TransactionContext;
    listItem: ListItem;
  }) => Promise<void>;
}
