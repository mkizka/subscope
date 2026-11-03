import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IListRepository } from "../../../application/interfaces/repositories/list-repository.js";
import type { ListRow } from "../../../application/record-parsers.js";

export class InMemoryListRepository implements IListRepository {
  private lists: Map<string, ListRow> = new Map();

  add(list: ListRow): void {
    this.lists.set(list.uri, list);
  }

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<ListRow | null> {
    return this.lists.get(uri.toString()) ?? null;
  }

  clear(): void {
    this.lists.clear();
  }

  async save({
    list,
  }: {
    ctx: TransactionContext;
    list: ListRow;
  }): Promise<void> {
    this.lists.set(list.uri, list);
  }
}
