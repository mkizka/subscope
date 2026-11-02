import type { Subscription, TransactionContext } from "@repo/common/domain";

import type { ISubscriptionQuery } from "../../../application/interfaces/queries/subscription-query.js";

export class InMemorySubscriptionQuery implements ISubscriptionQuery {
  private subscriptions: Map<string, Subscription> = new Map();

  add(subscription: Subscription): void {
    this.subscriptions.set(subscription.actorDid, subscription);
  }

  clear(): void {
    this.subscriptions.clear();
  }

  async isSubscriber(
    _ctx: TransactionContext,
    actorDid: string,
  ): Promise<boolean> {
    return this.subscriptions.has(actorDid);
  }

  async isFollowedByAnySubscriber(
    _ctx: TransactionContext,
    _subjectDid: string,
  ): Promise<boolean> {
    return false;
  }
}
