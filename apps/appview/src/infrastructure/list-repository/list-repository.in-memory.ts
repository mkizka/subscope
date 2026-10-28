import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { List, ListItem } from "@repo/common/domain";

import type { IListRepository } from "../../application/interfaces/list-repository.js";

export class InMemoryListRepository implements IListRepository {
  private lists: List[] = [];
  private items: ListItem[] = [];

  add(list: List): void {
    this.lists.push(list);
  }

  addItem(item: ListItem): void {
    this.items.push(item);
  }

  clear(): void {
    this.lists = [];
    this.items = [];
  }

  findByActor(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }): Promise<List[]> {
    const cursor = params.cursor && new Date(params.cursor);
    const items = this.lists
      .filter((list) => list.actorDid === params.actorDid)
      .filter((list) => !cursor || list.createdAt < cursor)
      .filter(
        (list) => !params.purposes || params.purposes.includes(list.purpose),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(items.slice(0, params.limit));
  }

  findByUri(uri: AtUri): Promise<List | null> {
    return Promise.resolve(
      this.lists.find((list) => list.uri.toString() === uri.toString()) ?? null,
    );
  }

  findItems(params: {
    listUri: AtUri;
    limit: number;
    cursor?: string;
  }): Promise<ListItem[]> {
    const cursor = params.cursor && new Date(params.cursor);
    const items = this.items
      .filter((item) => item.listUri.toString() === params.listUri.toString())
      .filter((item) => !cursor || item.createdAt < cursor)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(items.slice(0, params.limit));
  }
}
