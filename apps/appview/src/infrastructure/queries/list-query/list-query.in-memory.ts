import type { Did } from "@atproto/did";
import type { AtUri, AtUriString } from "@atproto/syntax";

import type {
  ListDto,
  ListItemDto,
} from "../../../application/dto/list-dto.js";
import type { IListQuery } from "../../../application/interfaces/queries/list-query.js";

export class InMemoryListQuery implements IListQuery {
  private lists: ListDto[] = [];
  private items: (ListItemDto & { listUri: AtUriString })[] = [];

  add(list: ListDto): void {
    this.lists.push(list);
  }

  addItem(item: ListItemDto & { listUri: AtUriString }): void {
    this.items.push(item);
  }

  findByAccount(params: {
    accountDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }): Promise<ListDto[]> {
    const cursor = params.cursor && new Date(params.cursor);
    return Promise.resolve(
      this.lists
        .filter((list) => list.accountDid === params.accountDid)
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

  findItemsBySubject(params: {
    listUris: AtUri[];
    subjectDid: Did;
  }): Promise<(ListItemDto & { listUri: AtUriString })[]> {
    const keys = params.listUris.map((uri) => uri.toString());
    return Promise.resolve(
      this.items.filter(
        (item) =>
          keys.includes(item.listUri) && item.subjectDid === params.subjectDid,
      ),
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
