import type { TransactionContext } from "@repo/common/domain";

import type { FeedItemRow } from "../../record-parsers.js";

export interface IFeedItemRepository {
  save: (params: {
    ctx: TransactionContext;
    feedItem: FeedItemRow;
  }) => Promise<void>;
}
