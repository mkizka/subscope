import type { Like, TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class LikeIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly indexLevel: number,
  ) {}
  static inject = ["subscriptionRepository", "indexLevel"] as const;

  async shouldIndex(ctx: TransactionContext, like: Like): Promise<boolean> {
    // いいねしたactorまたはいいねされたactorがsubscriberなら保存
    const hasAnySubscriber = await this.subscriptionRepository.hasSubscriber(
      ctx,
      [like.actorDid, like.subjectUri.hostname],
    );
    if (hasAnySubscriber) {
      return true;
    }

    // Level2: いいねされたactorがsubscribersのフォロイーなら保存
    if (this.indexLevel === 2) {
      return await this.subscriptionRepository.isFolloweeOfSubscribers(
        ctx,
        like.subjectUri.hostname,
      );
    }

    return false;
  }
}
