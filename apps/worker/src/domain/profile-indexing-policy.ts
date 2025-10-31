import type { TransactionContext } from "@repo/common/domain";
import type { Profile } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class ProfileIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async shouldIndex(
    ctx: TransactionContext,
    profile: Profile,
  ): Promise<boolean> {
    const isSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      profile.actorDid,
    );
    if (isSubscriber) {
      return true;
    }

    return this.subscriptionRepository.isFolloweeOfSubscribers(
      ctx,
      profile.actorDid,
    );
  }
}
