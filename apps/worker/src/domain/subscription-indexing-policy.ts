import type { TransactionContext } from "@repo/common/domain";
import type { Subscription } from "@repo/common/domain";

export class SubscriptionIndexingPolicy {
  static inject = [] as const;

  async shouldIndex(
    _ctx: TransactionContext,
    _subscription: Subscription,
  ): Promise<boolean> {
    // subscriptionレコードは常に保存する
    return Promise.resolve(true);
  }
}
