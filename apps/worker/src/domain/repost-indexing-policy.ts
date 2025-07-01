import type { TransactionContext } from "@repo/common/domain";
import type { Repost } from "@repo/common/domain";

import type { IPostRepository } from "../application/interfaces/repositories/post-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class RepostIndexingPolicy {
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

  async shouldIndex(ctx: TransactionContext, repost: Repost): Promise<boolean> {
    if (await this.subscriptionRepository.isSubscriber(ctx, repost.actorDid)) {
      return true;
    }

    const hasSubscriberFollower =
      await this.subscriptionRepository.hasSubscriberFollower(
        ctx,
        repost.actorDid,
      );
    if (hasSubscriberFollower) {
      return true;
    }

    // リポストしたポストの作成者がsubscribersなら保存
    const targetActorDid = await this.postRepository.findActorDidByUri(
      ctx,
      repost.subjectUri.toString(),
    );
    if (targetActorDid) {
      const isTargetActorSubscriber =
        await this.subscriptionRepository.isSubscriber(ctx, targetActorDid);
      if (isTargetActorSubscriber) {
        return true;
      }
    }

    if (this.indexLevel === 2) {
      const postExists = await this.postRepository.exists(
        ctx,
        repost.subjectUri.toString(),
      );
      if (postExists) {
        return true;
      }
    }

    return false;
  }
}
