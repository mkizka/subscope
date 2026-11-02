import type { FeedItem, TransactionContext } from "@repo/common/domain";

export interface IFeedItemRepository {
  save: (params: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }) => Promise<void>;
}
