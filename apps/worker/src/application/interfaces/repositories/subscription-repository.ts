import type { Subscription, TransactionContext } from "@repo/common/domain";

export interface ISubscriptionRepository {
  upsert: (params: {
    ctx: TransactionContext;
    subscription: Subscription;
  }) => Promise<void>;
  isSubscriber: (ctx: TransactionContext, actorDid: string) => Promise<boolean>;
}
