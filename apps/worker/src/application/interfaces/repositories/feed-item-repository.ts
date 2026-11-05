import type { TransactionContext } from "@repo/common/interface";

import type { FeedItem } from "../../dto/feed-item.js";

export interface IFeedItemRepository {
  save: (params: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }) => Promise<void>;
}
