import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IListItemRepository } from "../../../application/interfaces/repositories/list-item-repository.js";
import type { ListItemRow } from "../../../application/record-parsers.js";

export class InMemoryListItemRepository implements IListItemRepository {
  private listItems: Map<string, ListItemRow> = new Map();

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<ListItemRow | null> {
    return this.listItems.get(uri.toString()) ?? null;
  }

  async save({
    listItem,
  }: {
    ctx: TransactionContext;
    listItem: ListItemRow;
  }): Promise<void> {
    this.listItems.set(listItem.uri, listItem);
  }
}
