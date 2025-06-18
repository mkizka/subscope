import type { FeedItem, TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { IFeedItemRepository } from "../../application/interfaces/repositories/feed-item-repository.js";

export class FeedItemRepository implements IFeedItemRepository {
  async upsertPost({
    ctx,
    feedItem,
  }: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }): Promise<void> {
    await ctx.db
      .insert(schema.feedItems)
      .values({
        uri: feedItem.uri,
        cid: feedItem.cid,
        type: feedItem.type,
        subjectUri: feedItem.subjectUri,
        actorDid: feedItem.actorDid,
        sortAt: feedItem.sortAt,
      })
      .onConflictDoUpdate({
        target: schema.feedItems.uri,
        set: {
          cid: feedItem.cid,
          sortAt: feedItem.sortAt,
        },
      });
  }

  async upsertRepost({
    ctx,
    feedItem,
  }: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }): Promise<void> {
    await ctx.db
      .insert(schema.feedItems)
      .values({
        uri: feedItem.uri,
        cid: feedItem.cid,
        type: feedItem.type,
        subjectUri: feedItem.subjectUri,
        actorDid: feedItem.actorDid,
        sortAt: feedItem.sortAt,
      })
      .onConflictDoUpdate({
        target: schema.feedItems.uri,
        set: {
          cid: feedItem.cid,
          subjectUri: feedItem.subjectUri,
          sortAt: feedItem.sortAt,
        },
      });
  }
}
