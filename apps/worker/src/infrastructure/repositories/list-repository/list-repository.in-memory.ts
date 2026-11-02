import type { AtUri } from "@atproto/syntax";
import type { List, TransactionContext } from "@repo/common/domain";

import type { IListRepository } from "../../../application/interfaces/repositories/list-repository.js";

export class InMemoryListRepository implements IListRepository {
  private lists: Map<string, List> = new Map();

  add(list: List): void {
    this.lists.set(list.uri.toString(), list);
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

  async upsert({
    list,
  }: {
    ctx: TransactionContext;
    list: List;
  }): Promise<void> {
    this.lists.set(list.uri.toString(), list);
  }
}
