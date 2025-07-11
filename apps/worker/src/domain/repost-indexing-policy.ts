import type { TransactionContext } from "@repo/common/domain";
import type { Repost } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class RepostIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly indexLevel: number,
  ) {}
  static inject = ["subscriptionRepository", "indexLevel"] as const;

  async shouldIndex(ctx: TransactionContext, repost: Repost): Promise<boolean> {
    // リポストしたactorがsubscriberかチェック
    const isSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      repost.actorDid,
    );
    if (isSubscriber) {
      return true;
    }

    // リポストしたactorがsubscribersのフォロイーかチェック
    const hasSubscriberFollower =
      await this.subscriptionRepository.hasSubscriberFollower(
        ctx,
        repost.actorDid,
      );
    if (hasSubscriberFollower) {
      return true;
    }

    // リポスト対象の投稿者がsubscriberかチェック
    const isTargetSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      repost.subjectUri.hostname,
    );
    if (isTargetSubscriber) {
      return true;
    }

    // Level2: リポスト対象の投稿者がsubscribersのフォロイーかチェック
    if (this.indexLevel === 2) {
      return await this.subscriptionRepository.hasSubscriberFollower(
        ctx,
        repost.subjectUri.hostname,
      );
    }

    return false;
  }
}
