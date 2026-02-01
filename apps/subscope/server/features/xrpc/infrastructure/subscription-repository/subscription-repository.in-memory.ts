import type { Did } from "@atproto/did";
import type { Subscription, TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "@/server/features/xrpc/application/interfaces/subscription-repository.js";

export class InMemorySubscriptionRepository implements ISubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();

  add(subscription: Subscription): void {
    this.subscriptions.set(subscription.actorDid, subscription);
  }

  clear(): void {
    this.subscriptions.clear();
  }

  findMany(params: {
    limit: number;
    cursor?: string;
  }): Promise<Subscription[]> {
    let subscriptions = Array.from(this.subscriptions.values());

    subscriptions = subscriptions.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      subscriptions = subscriptions.filter((sub) => sub.createdAt < cursorDate);
    }

    return Promise.resolve(subscriptions.slice(0, params.limit));
  }

  findFirst(actorDid: Did): Promise<Subscription | null> {
    return Promise.resolve(this.subscriptions.get(actorDid) ?? null);
  }

  existsByInviteCode(inviteCode: string): Promise<boolean> {
    return Promise.resolve(
      Array.from(this.subscriptions.values()).some(
        (sub) => sub.inviteCode === inviteCode,
      ),
    );
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
