import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { IFeedItemRepository } from "../../../application/interfaces/repositories/feed-item-repository.js";
import type { FeedItem } from "../../../application/models/feed-item.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class FeedItemRepository implements IFeedItemRepository {
  async save({
    ctx,
    feedItem,
  }: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }): Promise<void> {
    const data = { ...feedItem, sortAt: sanitizeDate(feedItem.sortAt) };
    await ctx.db
      .insert(schema.feedItems)
      .values(data)
      .onConflictDoUpdate({ target: schema.feedItems.uri, set: data });
  }
}
