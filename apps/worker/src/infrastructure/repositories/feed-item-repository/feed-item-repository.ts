import type { FeedItem, TransactionContext } from "@repo/common/domain";
import { type FeedItemInsert, schema } from "@repo/db";

import type { IFeedItemRepository } from "../../../application/interfaces/repositories/feed-item-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class FeedItemRepository implements IFeedItemRepository {
  async upsert({
    ctx,
    feedItem,
  }: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }): Promise<void> {
    const data = {
      cid: feedItem.cid,
      type: feedItem.type,
      subjectUri: feedItem.subjectUri,
      actorDid: feedItem.actorDid,
      sortAt: sanitizeDate(feedItem.sortAt),
    } satisfies FeedItemInsert;
    await ctx.db
      .insert(schema.feedItems)
      .values({
        uri: feedItem.uri.toString(),
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.feedItems.uri,
        set: data,
      });
  }
}
