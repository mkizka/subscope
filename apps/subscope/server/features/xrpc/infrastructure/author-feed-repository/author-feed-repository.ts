import { asDid } from "@atproto/did";
import { type DatabaseClient, FeedItem } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";

import type { IAuthorFeedRepository } from "@/server/features/xrpc/application/interfaces/author-feed-repository.js";

export class AuthorFeedRepository implements IAuthorFeedRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findFeedItems({
    actorDid,
    cursor,
    limit,
  }: {
    actorDid: string;
    cursor?: Date;
    limit: number;
  }): Promise<FeedItem[]> {
    const filters = [eq(schema.feedItems.actorDid, actorDid)];
    if (cursor) {
      filters.push(lt(schema.feedItems.sortAt, cursor));
    }

    const feedItems = await this.db
      .select({
        uri: schema.feedItems.uri,
        cid: schema.feedItems.cid,
        sortAt: schema.feedItems.sortAt,
        type: schema.feedItems.type,
        actorDid: schema.feedItems.actorDid,
        subjectUri: schema.feedItems.subjectUri,
      })
      .from(schema.feedItems)
      .where(and(...filters))
      .orderBy(desc(schema.feedItems.sortAt))
      .limit(limit);

    return feedItems.map(
      (item) =>
        new FeedItem({
          uri: item.uri,
          cid: item.cid,
          type: item.type,
          subjectUri: item.subjectUri,
          actorDid: asDid(item.actorDid),
          sortAt: item.sortAt,
        }),
    );
  }

  async findFeedItemsWithoutReplies({
    actorDid,
    cursor,
    limit,
  }: {
    actorDid: string;
    cursor?: Date;
    limit: number;
  }): Promise<FeedItem[]> {
    const filters = [eq(schema.feedItems.actorDid, actorDid)];
    if (cursor) {
      filters.push(lt(schema.feedItems.sortAt, cursor));
    }

    const feedItems = await this.db
      .select({
        uri: schema.feedItems.uri,
        cid: schema.feedItems.cid,
        sortAt: schema.feedItems.sortAt,
        type: schema.feedItems.type,
        actorDid: schema.feedItems.actorDid,
        subjectUri: schema.feedItems.subjectUri,
      })
      .from(schema.feedItems)
      .leftJoin(schema.posts, eq(schema.feedItems.subjectUri, schema.posts.uri))
      .where(
        and(
          ...filters,
          or(
            eq(schema.feedItems.type, "repost"),

            and(
              eq(schema.feedItems.type, "post"),
              isNull(schema.posts.replyParentUri),
            ),
          ),
        ),
      )
      .orderBy(desc(schema.feedItems.sortAt))
      .limit(limit);

    return feedItems.map(
      (item) =>
        new FeedItem({
          uri: item.uri,
          cid: item.cid,
          type: item.type,
          subjectUri: item.subjectUri,
          actorDid: asDid(item.actorDid),
          sortAt: item.sortAt,
        }),
    );
  }
}
