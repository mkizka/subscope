import type { FeedItem, TransactionContext } from "@repo/common/domain";

export interface IFeedItemRepository {
  upsert: (params: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }) => Promise<void>;
}
