import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { List } from "../../../application/dto/list.js";
import type { IListRepository } from "../../../application/interfaces/repositories/list-repository.js";

export class InMemoryListRepository implements IListRepository {
  private lists: Map<string, List> = new Map();

  add(list: List): void {
    this.lists.set(list.uri, list);
  }

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<List | null> {
    return this.lists.get(uri.toString()) ?? null;
  }

  clear(): void {
    this.lists.clear();
  }

  async save({ list }: { ctx: TransactionContext; list: List }): Promise<void> {
    this.lists.set(list.uri, list);
  }
}
