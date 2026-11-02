import type { AtUri } from "@atproto/syntax";
import type { ListItem, TransactionContext } from "@repo/common/domain";

import type { IListItemRepository } from "../../../application/interfaces/repositories/list-item-repository.js";

export class InMemoryListItemRepository implements IListItemRepository {
  private listItems: Map<string, ListItem> = new Map();

  findByUri(uri: AtUri): ListItem | null {
    return this.listItems.get(uri.toString()) ?? null;
  }

  async save({
    listItem,
  }: {
    ctx: TransactionContext;
    listItem: ListItem;
  }): Promise<void> {
    this.listItems.set(listItem.uri.toString(), listItem);
  }
}
