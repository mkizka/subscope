import type { TransactionContext } from "@repo/common/domain";
import type { Subscription } from "@repo/common/domain";

import { env } from "../shared/env.js";

export class SubscriptionIndexingPolicy {
  static inject = [] as const;

  shouldIndex(
    _ctx: TransactionContext,
    subscription: Subscription,
  ): Promise<boolean> {
    return Promise.resolve(subscription.appviewDid === env.APPVIEW_DID);
  }
}
