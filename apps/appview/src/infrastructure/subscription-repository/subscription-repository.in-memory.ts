import type { Did } from "@atproto/did";
import type { Subscription } from "@repo/common/domain";
import { type TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../../application/interfaces/subscription-repository.js";

export class InMemorySubscriptionRepository implements ISubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();

  add(subscription: Subscription): void {
    this.subscriptions.set(subscription.actorDid, subscription);
  }

  find(actorDid: Did): Promise<Subscription | null> {
    return Promise.resolve(this.subscriptions.get(actorDid) ?? null);
  }

  save(_params: {
    subscription: Subscription;
    ctx: TransactionContext;
  }): Promise<void> {
    this.subscriptions.set(_params.subscription.actorDid, _params.subscription);
    return Promise.resolve();
  }

  delete(actorDid: Did): Promise<void> {
    this.subscriptions.delete(actorDid);
    return Promise.resolve();
  }
}
