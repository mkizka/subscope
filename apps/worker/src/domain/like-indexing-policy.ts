import type { Like, TransactionContext } from "@repo/common/domain";

import type { IPostRepository } from "../application/interfaces/repositories/post-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class LikeIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly postRepository: IPostRepository,
    private readonly indexLevel: number,
  ) {}
  static inject = [
    "subscriptionRepository",
    "postRepository",
    "indexLevel",
  ] as const;

  async shouldIndex(ctx: TransactionContext, like: Like): Promise<boolean> {
    // いいねしたactorがsubscriberかチェック
    const isSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      like.actorDid,
    );
    if (isSubscriber) {
      return true;
    }

    // いいね対象の投稿者をチェック
    const targetActorDid = await this.postRepository.findActorDidByUri(
      ctx,
      like.subjectUri.toString(),
    );
    if (targetActorDid) {
      // Level1: いいね対象の投稿者がsubscriberかチェック
      const isTargetSubscriber = await this.subscriptionRepository.isSubscriber(
        ctx,
        targetActorDid,
      );
      if (isTargetSubscriber) {
        return true;
      }

      // Level2: いいね対象の投稿者がsubscribersのフォロイーかチェック
      if (this.indexLevel === 2) {
        return await this.subscriptionRepository.hasSubscriberFollower(
          ctx,
          targetActorDid,
        );
      }
    }

    return false;
  }
}
