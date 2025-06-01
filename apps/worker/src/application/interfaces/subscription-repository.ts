import type { Subscription, TransactionContext } from "@dawn/common/domain";

export interface ISubscriptionRepository {
  upsert: (params: {
    ctx: TransactionContext;
    subscription: Subscription;
  }) => Promise<void>;
}
