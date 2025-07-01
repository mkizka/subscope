import type { Follow, TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class FollowIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async shouldIndex(ctx: TransactionContext, follow: Follow): Promise<boolean> {
    return this.subscriptionRepository.hasAnySubscriber(ctx, [
      follow.actorDid,
      follow.subjectDid,
    ]);
  }
}
