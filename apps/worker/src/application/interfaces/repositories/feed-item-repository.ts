import type { TransactionContext } from "@repo/common/domain";

import type { FeedItem } from "../../models/feed-item.js";

export interface IFeedItemRepository {
  save: (params: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }) => Promise<void>;
}
