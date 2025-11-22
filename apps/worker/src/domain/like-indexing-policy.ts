import type { Like, TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class LikeIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async shouldIndex(ctx: TransactionContext, like: Like): Promise<boolean> {
    // いいねしたactorまたはいいねされたactorがsubscriberなら保存
    const hasAnySubscriber = await this.subscriptionRepository.hasSubscriber(
      ctx,
      [like.actorDid, like.subjectUri.hostname],
    );
    if (hasAnySubscriber) {
      return true;
    }

    // いいねされたactorがsubscribersのフォロイーなら保存
    return await this.subscriptionRepository.isFolloweeOfSubscribers(
      ctx,
      like.subjectUri.hostname,
    );
  }
}
