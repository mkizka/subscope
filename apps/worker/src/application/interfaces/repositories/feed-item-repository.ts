import type { FeedItem, TransactionContext } from "@repo/common/domain";

export interface IFeedItemRepository {
  upsertPost: (params: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }) => Promise<void>;

  upsertRepost: (params: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }) => Promise<void>;
}
