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
    const level1Result = await this.shouldIndexLevel1(ctx, repost);
    if (level1Result) {
      return true;
    }

    if (this.indexLevel === 2) {
      return await this.shouldIndexLevel2(ctx, repost);
    }

    return false;
  }

  private async shouldIndexLevel1(
    ctx: TransactionContext,
    repost: Repost,
  ): Promise<boolean> {
    const isSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      repost.actorDid,
    );
    if (isSubscriber) {
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

    const targetActorDid = await this.postRepository.findActorDidByUri(
      ctx,
      repost.subjectUri.toString(),
    );
    if (targetActorDid) {
      return this.subscriptionRepository.isSubscriber(ctx, targetActorDid);
    }

    return false;
  }

  private async shouldIndexLevel2(
    ctx: TransactionContext,
    repost: Repost,
  ): Promise<boolean> {
    return this.postRepository.exists(ctx, repost.subjectUri.toString());
  }
}
