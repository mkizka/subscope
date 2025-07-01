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
    return this.subscriptionRepository.isSubscriber(ctx, profile.actorDid);
  }
}
