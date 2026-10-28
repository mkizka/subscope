import type { Did } from "@atproto/did";
import type { List } from "@repo/common/domain";

import type { IListRepository } from "../../application/interfaces/list-repository.js";

export class InMemoryListRepository implements IListRepository {
  private lists: List[] = [];

  add(list: List): void {
    this.lists.push(list);
  }

  clear(): void {
    this.lists = [];
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
}
