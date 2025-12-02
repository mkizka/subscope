import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../../../application/interfaces/repositories/subscription-repository.js";
import type { ITrackedActorChecker } from "../../../application/interfaces/repositories/tracked-actor-checker.js";

export class InMemoryTrackedActorChecker implements ITrackedActorChecker {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async isTrackedActor(actorDid: Did): Promise<boolean> {
    const ctx = this.createDummyContext();
    const isSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      actorDid,
    );
    if (isSubscriber) {
      return true;
    }

    return this.subscriptionRepository.isFolloweeOfSubscribers(ctx, actorDid);
  }

  async hasTrackedActor(actorDids: Did[]): Promise<boolean> {
    if (actorDids.length === 0) {
      return false;
    }

    const ctx = this.createDummyContext();
    const hasSubscriber = await this.subscriptionRepository.hasSubscriber(
      ctx,
      actorDids,
    );
    if (hasSubscriber) {
      return true;
    }

    return this.subscriptionRepository.hasFolloweeOfSubscribers(ctx, actorDids);
  }

  clear(): void {
    // InMemoryTrackedActorCheckerは内部状態を持たないため、何もしない
  }

  private createDummyContext(): TransactionContext {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {} as TransactionContext;
  }
}
