import { asDid, type Did } from "@atproto/did";
import { asAtUriString } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/interface";
import { schema } from "@repo/db";
import { and, desc, eq, exists, isNull, lt, or, sql } from "drizzle-orm";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import type { ITimelineQuery } from "../../../application/interfaces/queries/timeline-query.js";

export class TimelineQuery implements ITimelineQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findFeedItems({
    viewerDid,
    cursor,
    limit,
  }: {
    viewerDid: Did;
    cursor?: Date;
    limit: number;
  }): Promise<FeedItemDto[]> {
    const filters = [];
    if (cursor) {
      filters.push(lt(schema.feedItems.sortAt, cursor));
    }

    const feedItems = await this.db
      .select({
        uri: schema.feedItems.uri,
        sortAt: schema.feedItems.sortAt,
        type: schema.feedItems.type,
        accountDid: schema.feedItems.accountDid,
        subjectUri: schema.feedItems.subjectUri,
      })
      .from(schema.feedItems)
      .where(
        and(
          ...filters,
          exists(
            this.db
              .select()
              .from(schema.follows)
              .where(
                and(
                  eq(schema.follows.accountDid, viewerDid),
                  eq(schema.follows.subjectDid, schema.feedItems.accountDid),
                ),
              ),
          ),
        ),
      )
      .unionAll(
        this.db
          .select({
            uri: schema.feedItems.uri,
            sortAt: schema.feedItems.sortAt,
            type: schema.feedItems.type,
            accountDid: schema.feedItems.accountDid,
            subjectUri: schema.feedItems.subjectUri,
          })
          .from(schema.feedItems)
          .where(and(...filters, eq(schema.feedItems.accountDid, viewerDid))),
      )
      .orderBy(desc(sql`"sort_at"`))
      .limit(limit);

    return feedItems.map(toFeedItemDto);
  }

  async findLocalFeedItems({
    cursor,
    limit,
  }: {
    cursor?: Date;
    limit: number;
  }): Promise<FeedItemDto[]> {
    const feedItems = await this.db
      .select({
        uri: schema.feedItems.uri,
        sortAt: schema.feedItems.sortAt,
        type: schema.feedItems.type,
        accountDid: schema.feedItems.accountDid,
        subjectUri: schema.feedItems.subjectUri,
      })
      .from(schema.feedItems)
      .leftJoin(schema.posts, eq(schema.feedItems.uri, schema.posts.uri))
      .where(
        and(
          cursor ? lt(schema.feedItems.sortAt, cursor) : undefined,
          or(
            eq(schema.feedItems.type, "repost"),
            isNull(schema.posts.replyParentUri),
          ),
          exists(
            this.db
              .select()
              .from(schema.registrations)
              .where(
                eq(
                  schema.registrations.accountDid,
                  schema.feedItems.accountDid,
                ),
              ),
          ),
        ),
      )
      .orderBy(desc(schema.feedItems.sortAt))
      .limit(limit);

    return feedItems.map(toFeedItemDto);
  }

  async findListFeedItems({
    listUri,
    cursor,
    limit,
  }: {
    listUri: string;
    cursor?: Date;
    limit: number;
  }): Promise<FeedItemDto[]> {
    const filters = [];
    if (cursor) {
      filters.push(lt(schema.feedItems.sortAt, cursor));
    }

    const feedItems = await this.db
      .select()
      .from(schema.feedItems)
      .where(
        and(
          ...filters,
          exists(
            this.db
              .select()
              .from(schema.listItems)
              .where(
                and(
                  eq(schema.listItems.listUri, listUri),
                  eq(schema.listItems.subjectDid, schema.feedItems.accountDid),
                ),
              ),
          ),
        ),
      )
      .orderBy(desc(schema.feedItems.sortAt))
      .limit(limit);

    return feedItems.map(toFeedItemDto);
  }
}

const toFeedItemDto = (item: {
  uri: string;
  type: FeedItemDto["type"];
  subjectUri: string | null;
  accountDid: string;
  sortAt: Date;
}): FeedItemDto => ({
  uri: asAtUriString(item.uri),
  type: item.type,
  subjectUri: item.subjectUri ? asAtUriString(item.subjectUri) : null,
  accountDid: asDid(item.accountDid),
  sortAt: item.sortAt,
});
