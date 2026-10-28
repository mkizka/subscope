import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { List, ListItem } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, inArray, lt } from "drizzle-orm";

import type { IListRepository } from "../../application/interfaces/list-repository.js";

export class ListRepository implements IListRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findByActor(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }): Promise<List[]> {
    const filters = [eq(schema.lists.actorDid, params.actorDid)];

    if (params.cursor) {
      filters.push(lt(schema.lists.createdAt, new Date(params.cursor)));
    }

    if (params.purposes) {
      filters.push(inArray(schema.lists.purpose, params.purposes));
    }

    const results = await this.db.query.lists.findMany({
      where: and(...filters),
      orderBy: [desc(schema.lists.createdAt)],
      limit: params.limit,
    });

    return results.map(toList);
  }

  async findByUri(uri: AtUri): Promise<List | null> {
    const result = await this.db.query.lists.findFirst({
      where: eq(schema.lists.uri, uri.toString()),
    });
    return result ? toList(result) : null;
  }

  async findItems(params: {
    listUri: AtUri;
    limit: number;
    cursor?: string;
  }): Promise<ListItem[]> {
    const filters = [eq(schema.listItems.listUri, params.listUri.toString())];

    if (params.cursor) {
      filters.push(lt(schema.listItems.createdAt, new Date(params.cursor)));
    }

    const results = await this.db.query.listItems.findMany({
      where: and(...filters),
      orderBy: [desc(schema.listItems.createdAt)],
      limit: params.limit,
    });

    return results.map((result) => new ListItem(result));
  }
}

const toList = (result: typeof schema.lists.$inferSelect) =>
  new List({
    ...result,
    description: result.description ?? undefined,
    avatarCid: result.avatarCid ?? undefined,
  });
