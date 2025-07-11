import type { Like, TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class LikeIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly indexLevel: number,
  ) {}
  static inject = ["subscriptionRepository", "indexLevel"] as const;

  async shouldIndex(ctx: TransactionContext, like: Like): Promise<boolean> {
    // いいねしたactorがsubscriberかチェック
    const isSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      like.actorDid,
    );
    if (isSubscriber) {
      return true;
    }

    // Level1: いいね対象の投稿者がsubscriberかチェック
    const isTargetSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      like.subjectUri.hostname,
    );
    if (isTargetSubscriber) {
      return true;
    }

    // Level2: いいね対象の投稿者がsubscribersのフォロイーかチェック
    if (this.indexLevel === 2) {
      return await this.subscriptionRepository.hasSubscriberFollower(
        ctx,
        like.subjectUri.hostname,
      );
    }

    return false;
  }
}
