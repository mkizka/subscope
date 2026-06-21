import type { Subscription, TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../../../application/interfaces/repositories/subscription-repository.js";

export class InMemorySubscriptionRepository implements ISubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();

  add(subscription: Subscription): void {
    this.subscriptions.set(subscription.actorDid, subscription);
  }

  clear(): void {
    this.subscriptions.clear();
  }

  async upsert({
    subscription,
  }: {
    ctx: TransactionContext;
    subscription: Subscription;
  }): Promise<void> {
    this.subscriptions.set(subscription.actorDid, subscription);
  }

  async isSubscriber(
    _ctx: TransactionContext,
    actorDid: string,
  ): Promise<boolean> {
    return this.subscriptions.has(actorDid);
  }
}
