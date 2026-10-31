import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { ListDto, ListItemDto } from "../../application/dto/list-dto.js";
import type { IListQuery } from "../../application/interfaces/list-query.js";

export class InMemoryListQuery implements IListQuery {
  private lists: ListDto[] = [];
  private items: (ListItemDto & { listUri: string })[] = [];

  add(list: ListDto): void {
    this.lists.push(list);
  }

  addItem(item: ListItemDto & { listUri: string }): void {
    this.items.push(item);
  }

  findByActor(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }): Promise<ListDto[]> {
    const cursor = params.cursor && new Date(params.cursor);
    return Promise.resolve(
      this.lists
        .filter((list) => list.actorDid === params.actorDid)
        .filter((list) => !cursor || list.createdAt < cursor)
        .filter(
          (list) => !params.purposes || params.purposes.includes(list.purpose),
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, params.limit),
    );
  }

  findByUris(uris: AtUri[]): Promise<ListDto[]> {
    const keys = uris.map((uri) => uri.toString());
    return Promise.resolve(
      this.lists.filter((list) => keys.includes(list.uri)),
    );
  }

  findItems(params: {
    listUri: AtUri;
    limit: number;
    cursor?: string;
  }): Promise<ListItemDto[]> {
    const cursor = params.cursor && new Date(params.cursor);
    return Promise.resolve(
      this.items
        .filter((item) => item.listUri === params.listUri.toString())
        .filter((item) => !cursor || item.createdAt < cursor)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, params.limit)
        .map(({ uri, subjectDid, createdAt }) => ({
          uri,
          subjectDid,
          createdAt,
        })),
    );
  }
}
