import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../../application/interfaces/repositories/subscription-repository.js";
import type { ITrackedActorRepository } from "../../application/interfaces/repositories/tracked-actor-repository.js";

export class TrackedActorRepository implements ITrackedActorRepository {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async isTrackedActor(
    ctx: TransactionContext,
    actorDid: Did,
  ): Promise<boolean> {
    const isSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      actorDid,
    );
    if (isSubscriber) {
      return true;
    }

    return this.subscriptionRepository.isFolloweeOfSubscribers(ctx, actorDid);
  }

  async hasTrackedActor(
    ctx: TransactionContext,
    actorDids: Did[],
  ): Promise<boolean> {
    if (actorDids.length === 0) {
      return false;
    }

    const hasSubscriber = await this.subscriptionRepository.hasSubscriber(
      ctx,
      actorDids,
    );
    if (hasSubscriber) {
      return true;
    }

    return this.subscriptionRepository.hasFolloweeOfSubscribers(ctx, actorDids);
  }
}
