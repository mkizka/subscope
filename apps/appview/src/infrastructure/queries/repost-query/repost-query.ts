import { asDid, type Did } from "@atproto/did";
import { asAtUriString, type AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, inArray, lt } from "drizzle-orm";

import type { RepostDto } from "../../../application/dto/repost-dto.js";
import type { IRepostQuery } from "../../../application/interfaces/queries/repost-query.js";

const columns = {
  uri: schema.reposts.uri,
  actorDid: schema.reposts.actorDid,
  subjectUri: schema.reposts.subjectUri,
  indexedAt: schema.reposts.indexedAt,
  sortAt: schema.reposts.sortAt,
};

const toRepostDto = (row: {
  uri: string;
  actorDid: string;
  subjectUri: string;
  indexedAt: Date;
  sortAt: Date;
}): RepostDto => ({
  uri: asAtUriString(row.uri),
  actorDid: asDid(row.actorDid),
  subjectUri: asAtUriString(row.subjectUri),
  indexedAt: row.indexedAt,
  sortAt: row.sortAt,
});

export class RepostQuery implements IRepostQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findByUris(uris: AtUri[]): Promise<RepostDto[]> {
    if (uris.length === 0) {
      return [];
    }
    const rows = await this.db
      .select(columns)
      .from(schema.reposts)
      .where(
        inArray(
          schema.reposts.uri,
          uris.map((uri) => uri.toString()),
        ),
      );
    return rows.map(toRepostDto);
  }

  async findViewerReposts({
    viewerDid,
    subjectUris,
  }: {
    viewerDid: Did;
    subjectUris: AtUri[];
  }): Promise<RepostDto[]> {
    if (subjectUris.length === 0) {
      return [];
    }
    const rows = await this.db
      .select(columns)
      .from(schema.reposts)
      .where(
        and(
          eq(schema.reposts.actorDid, viewerDid),
          inArray(
            schema.reposts.subjectUri,
            subjectUris.map((uri) => uri.toString()),
          ),
        ),
      );
    return rows.map(toRepostDto);
  }

  async findBySubject({
    subjectUri,
    limit,
    cursor,
  }: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }): Promise<RepostDto[]> {
    const filters = [eq(schema.reposts.subjectUri, subjectUri)];
    if (cursor) {
      filters.push(lt(schema.reposts.sortAt, cursor));
    }
    const rows = await this.db
      .select(columns)
      .from(schema.reposts)
      .where(and(...filters))
      .orderBy(desc(schema.reposts.sortAt))
      .limit(limit);
    return rows.map(toRepostDto);
  }
}
