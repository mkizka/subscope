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
    const isLikerSubscriber =
      await this.subscriptionRepository.hasAnySubscriber(ctx, [like.actorDid]);
    if (isLikerSubscriber) {
      return true;
    }

    // いいねしたポストの作成者がsubscribersなら保存
    const targetActorDid = await this.postRepository.findActorDidByUri(
      ctx,
      like.subjectUri.toString(),
    );
    if (targetActorDid) {
      const isTargetActorSubscriber =
        await this.subscriptionRepository.isSubscriber(ctx, targetActorDid);
      if (isTargetActorSubscriber) {
        return true;
      }
    }

    if (this.indexLevel === 2) {
      return this.postRepository.exists(ctx, like.subjectUri.toString());
    }

    return false;
  }
}
