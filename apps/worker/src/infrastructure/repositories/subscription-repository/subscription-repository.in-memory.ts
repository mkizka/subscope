import type { Subscription, TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../../../application/interfaces/repositories/subscription-repository.js";

export class InMemorySubscriptionRepository implements ISubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();
  private follows: Map<string, Set<string>> = new Map();

  add(subscription: Subscription): void {
    this.subscriptions.set(subscription.actorDid, subscription);
  }

  addFollow(actorDid: string, subjectDid: string): void {
    if (!this.follows.has(actorDid)) {
      this.follows.set(actorDid, new Set());
    }
    const followSet = this.follows.get(actorDid);
    if (followSet) {
      followSet.add(subjectDid);
    }
  }

  clear(): void {
    this.subscriptions.clear();
    this.follows.clear();
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

  async hasSubscriber(
    _ctx: TransactionContext,
    actorDids: string[],
  ): Promise<boolean> {
    return actorDids.some((did) => this.subscriptions.has(did));
  }

  async isFolloweeOfSubscribers(
    _ctx: TransactionContext,
    actorDid: string,
  ): Promise<boolean> {
    for (const [subscriberDid, followeeDids] of this.follows.entries()) {
      if (this.subscriptions.has(subscriberDid) && followeeDids.has(actorDid)) {
        return true;
      }
    }
    return false;
  }

  async hasFolloweeOfSubscribers(
    _ctx: TransactionContext,
    actorDids: string[],
  ): Promise<boolean> {
    for (const actorDid of actorDids) {
      if (await this.isFolloweeOfSubscribers(_ctx, actorDid)) {
        return true;
      }
    }
    return false;
  }
}
