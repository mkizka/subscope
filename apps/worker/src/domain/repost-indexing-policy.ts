import type { TransactionContext } from "@repo/common/domain";
import type { Repost } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class RepostIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async shouldIndex(ctx: TransactionContext, repost: Repost): Promise<boolean> {
    // subscribers本人のrepostは保存
    if (await this.subscriptionRepository.isSubscriber(ctx, repost.actorDid)) {
      return true;
    }

    // repost者のフォロワーが1人以上subscribersなら保存
    return await this.subscriptionRepository.hasSubscriberFollower(
      ctx,
      repost.actorDid,
    );
  }
}
