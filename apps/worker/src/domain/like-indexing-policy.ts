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
    const level1Result = await this.shouldIndexLevel1(ctx, like);
    if (level1Result) {
      return true;
    }

    if (this.indexLevel === 2) {
      return await this.shouldIndexLevel2(ctx, like);
    }

    return false;
  }

  private async shouldIndexLevel1(
    ctx: TransactionContext,
    like: Like,
  ): Promise<boolean> {
    const isSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      like.actorDid,
    );
    if (isSubscriber) {
      return true;
    }

    const targetActorDid = await this.postRepository.findActorDidByUri(
      ctx,
      like.subjectUri.toString(),
    );
    if (targetActorDid) {
      return await this.subscriptionRepository.isSubscriber(
        ctx,
        targetActorDid,
      );
    }

    return false;
  }

  private async shouldIndexLevel2(
    ctx: TransactionContext,
    like: Like,
  ): Promise<boolean> {
    return this.postRepository.exists(ctx, like.subjectUri.toString());
  }
}
