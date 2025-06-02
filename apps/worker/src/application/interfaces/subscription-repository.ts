import type { Subscription, TransactionContext } from "@dawn/common/domain";

export interface ISubscriptionRepository {
  upsert: (params: {
    ctx: TransactionContext;
    subscription: Subscription;
  }) => Promise<void>;
  isSubscriber: (ctx: TransactionContext, actorDid: string) => Promise<boolean>;
  hasAnySubscriber: (
    ctx: TransactionContext,
    actorDids: string[],
  ) => Promise<boolean>;
  hasSubscriberFollower: (
    ctx: TransactionContext,
    actorDid: string,
  ) => Promise<boolean>;
}
