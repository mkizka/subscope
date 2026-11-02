import { asDid, type Did } from "@atproto/did";
import { asAtUriString, type AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, inArray, lt } from "drizzle-orm";

import type { FeedItemDto } from "../../application/dto/feed-item-dto.js";
import type {
  LikeDto,
  SubjectLikeDto,
} from "../../application/dto/like-dto.js";
import type { ILikeQuery } from "../../application/interfaces/like-query.js";

export class LikeQuery implements ILikeQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findViewerLikes({
    viewerDid,
    subjectUris,
  }: {
    viewerDid: Did;
    subjectUris: AtUri[];
  }): Promise<LikeDto[]> {
    if (subjectUris.length === 0) {
      return [];
    }
    const rows = await this.db
      .select({ uri: schema.likes.uri, subjectUri: schema.likes.subjectUri })
      .from(schema.likes)
      .where(
        and(
          eq(schema.likes.actorDid, viewerDid),
          inArray(
            schema.likes.subjectUri,
            subjectUris.map((uri) => uri.toString()),
          ),
        ),
      );
    return rows.map((row) => ({
      uri: asAtUriString(row.uri),
      subjectUri: asAtUriString(row.subjectUri),
    }));
  }

  async findActorLikeFeedItems({
    actorDid,
    limit,
    cursor,
  }: {
    actorDid: Did;
    limit: number;
    cursor?: Date;
  }): Promise<FeedItemDto[]> {
    const filters = [eq(schema.likes.actorDid, actorDid)];
    if (cursor) {
      filters.push(lt(schema.likes.sortAt, cursor));
    }
    const rows = await this.db
      .select({
        subjectUri: schema.likes.subjectUri,
        sortAt: schema.likes.sortAt,
      })
      .from(schema.likes)
      .where(and(...filters))
      .orderBy(desc(schema.likes.sortAt))
      .limit(limit);
    return rows.map((row) => ({
      uri: asAtUriString(row.subjectUri),
      type: "post",
      subjectUri: null,
      actorDid,
      sortAt: row.sortAt,
    }));
  }

  async findSubjectLikes({
    subjectUri,
    limit,
    cursor,
  }: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }): Promise<SubjectLikeDto[]> {
    const filters = [eq(schema.likes.subjectUri, subjectUri)];
    if (cursor) {
      filters.push(lt(schema.likes.sortAt, cursor));
    }
    const rows = await this.db
      .select({
        actorDid: schema.likes.actorDid,
        createdAt: schema.likes.createdAt,
        sortAt: schema.likes.sortAt,
      })
      .from(schema.likes)
      .where(and(...filters))
      .orderBy(desc(schema.likes.sortAt))
      .limit(limit);
    return rows.map((row) => ({ ...row, actorDid: asDid(row.actorDid) }));
  }
}
