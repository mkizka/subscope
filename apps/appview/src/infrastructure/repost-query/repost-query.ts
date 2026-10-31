import type { Did } from "@atproto/did";
import { asAtUriString, type AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, eq, inArray } from "drizzle-orm";

import type { RepostDto } from "../../application/dto/repost-dto.js";
import type { IRepostQuery } from "../../application/interfaces/repost-query.js";

const columns = {
  uri: schema.reposts.uri,
  subjectUri: schema.reposts.subjectUri,
  indexedAt: schema.reposts.indexedAt,
};

const toRepostDto = (row: {
  uri: string;
  subjectUri: string;
  indexedAt: Date;
}): RepostDto => ({
  uri: asAtUriString(row.uri),
  subjectUri: asAtUriString(row.subjectUri),
  indexedAt: row.indexedAt,
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
}
