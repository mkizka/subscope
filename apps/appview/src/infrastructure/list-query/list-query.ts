import { asDid, type Did } from "@atproto/did";
import { asAtUriString, type AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, inArray, lt } from "drizzle-orm";

import type { ListDto, ListItemDto } from "../../application/dto/list-dto.js";
import type { IListQuery } from "../../application/interfaces/list-query.js";

export class ListQuery implements IListQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findByActor(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }): Promise<ListDto[]> {
    const filters = [eq(schema.lists.actorDid, params.actorDid)];
    if (params.cursor) {
      filters.push(lt(schema.lists.createdAt, new Date(params.cursor)));
    }
    if (params.purposes) {
      filters.push(inArray(schema.lists.purpose, params.purposes));
    }
    const lists = await this.db
      .select()
      .from(schema.lists)
      .where(and(...filters))
      .orderBy(desc(schema.lists.createdAt))
      .limit(params.limit);
    return lists.map(toListDto);
  }

  async findByUris(uris: AtUri[]): Promise<ListDto[]> {
    if (uris.length === 0) {
      return [];
    }
    const lists = await this.db
      .select()
      .from(schema.lists)
      .where(
        inArray(
          schema.lists.uri,
          uris.map((uri) => uri.toString()),
        ),
      );
    return lists.map(toListDto);
  }

  async findItems(params: {
    listUri: AtUri;
    limit: number;
    cursor?: string;
  }): Promise<ListItemDto[]> {
    const filters = [eq(schema.listItems.listUri, params.listUri.toString())];
    if (params.cursor) {
      filters.push(lt(schema.listItems.createdAt, new Date(params.cursor)));
    }
    const items = await this.db
      .select({
        uri: schema.listItems.uri,
        subjectDid: schema.listItems.subjectDid,
        createdAt: schema.listItems.createdAt,
      })
      .from(schema.listItems)
      .where(and(...filters))
      .orderBy(desc(schema.listItems.createdAt))
      .limit(params.limit);
    return items.map((item) => ({
      uri: asAtUriString(item.uri),
      subjectDid: asDid(item.subjectDid),
      createdAt: item.createdAt,
    }));
  }
}

const toListDto = (list: typeof schema.lists.$inferSelect): ListDto => ({
  uri: asAtUriString(list.uri),
  cid: list.cid,
  actorDid: asDid(list.actorDid),
  name: list.name,
  purpose: list.purpose,
  description: list.description,
  avatarCid: list.avatarCid,
  createdAt: list.createdAt,
  indexedAt: list.indexedAt,
});
