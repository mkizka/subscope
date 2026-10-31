import { asDid, type Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, eq, inArray } from "drizzle-orm";

import type { ListItemDto } from "../../application/dto/list-item-dto.js";
import type { IListItemQuery } from "../../application/interfaces/list-item-query.js";

export class ListItemQuery implements IListItemQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findItems(params: {
    listUris: string[];
    subjectDid: Did;
  }): Promise<ListItemDto[]> {
    if (params.listUris.length === 0) {
      return [];
    }
    const items = await this.db.query.listItems.findMany({
      where: and(
        inArray(schema.listItems.listUri, params.listUris),
        eq(schema.listItems.subjectDid, params.subjectDid),
      ),
    });
    return items.map((item) => ({
      uri: item.uri,
      listUri: item.listUri,
      subjectDid: asDid(item.subjectDid),
    }));
  }
}
