import { asDid } from "@atproto/did";
import { type DatabaseClient, FeedItem } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  and,
  desc,
  eq,
  exists,
  isNull,
  like,
  lt,
  or,
  type SQL,
} from "drizzle-orm";

import type { IAuthorFeedRepository } from "../../application/interfaces/author-feed-repository.js";

type FindParams = {
  actorDid: string;
  cursor?: Date;
  limit: number;
};

export class AuthorFeedRepository implements IAuthorFeedRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findFeedItems(
    { actorDid, cursor, limit }: FindParams,
    condition?: SQL,
  ): Promise<FeedItem[]> {
    const filters = [eq(schema.feedItems.actorDid, actorDid), condition];
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
      .leftJoin(schema.posts, eq(schema.feedItems.uri, schema.posts.uri))
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

  findFeedItemsWithoutReplies(params: FindParams): Promise<FeedItem[]> {
    return this.findFeedItems(
      params,
      or(
        eq(schema.feedItems.type, "repost"),
        isNull(schema.posts.replyParentUri),
      ),
    );
  }

  findFeedItemsWithMedia(params: FindParams): Promise<FeedItem[]> {
    return this.findFeedItems(
      params,
      and(
        eq(schema.feedItems.type, "post"),
        exists(
          this.db
            .select()
            .from(schema.postEmbedImages)
            .where(eq(schema.postEmbedImages.postUri, schema.feedItems.uri)),
        ),
      ),
    );
  }

  findFeedItemsWithAuthorThreads(params: FindParams): Promise<FeedItem[]> {
    const authorUri = `at://${params.actorDid}/%`;
    return this.findFeedItems(
      params,
      or(
        eq(schema.feedItems.type, "repost"),
        isNull(schema.posts.replyParentUri),
        and(
          like(schema.posts.replyRootUri, authorUri),
          like(schema.posts.replyParentUri, authorUri),
        ),
      ),
    );
  }
}
