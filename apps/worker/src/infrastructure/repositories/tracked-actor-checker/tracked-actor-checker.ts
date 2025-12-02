import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../../../application/interfaces/repositories/subscription-repository.js";
import type { ITrackedActorChecker } from "../../../application/interfaces/repositories/tracked-actor-checker.js";

export class TrackedActorChecker implements ITrackedActorChecker {
  constructor(
    private readonly db: DatabaseClient,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["db", "subscriptionRepository"] as const;

  async isTrackedActor(actorDid: Did): Promise<boolean> {
    const ctx = { db: this.db };
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

    const ctx = { db: this.db };
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
