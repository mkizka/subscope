import { asDid } from "@atproto/did";
import { asAtUriString } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
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

import type { FeedItemDto } from "../../application/dto/feed-item-dto.js";
import type { IAuthorFeedQuery } from "../../application/interfaces/author-feed-query.js";

type FindParams = {
  actorDid: string;
  cursor?: Date;
  limit: number;
};

export class AuthorFeedQuery implements IAuthorFeedQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findFeedItems(
    { actorDid, cursor, limit }: FindParams,
    condition?: SQL,
  ): Promise<FeedItemDto[]> {
    const filters = [eq(schema.feedItems.actorDid, actorDid), condition];
    if (cursor) {
      filters.push(lt(schema.feedItems.sortAt, cursor));
    }

    const feedItems = await this.db
      .select({
        uri: schema.feedItems.uri,
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

    return feedItems.map((item) => ({
      uri: asAtUriString(item.uri),
      type: item.type,
      subjectUri: item.subjectUri ? asAtUriString(item.subjectUri) : null,
      actorDid: asDid(item.actorDid),
      sortAt: item.sortAt,
    }));
  }

  findFeedItemsWithoutReplies(params: FindParams): Promise<FeedItemDto[]> {
    return this.findFeedItems(
      params,
      or(
        eq(schema.feedItems.type, "repost"),
        isNull(schema.posts.replyParentUri),
      ),
    );
  }

  findFeedItemsWithMedia(params: FindParams): Promise<FeedItemDto[]> {
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

  findFeedItemsWithAuthorThreads(params: FindParams): Promise<FeedItemDto[]> {
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
