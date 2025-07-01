import type { Post, TransactionContext } from "@repo/common/domain";

import type { IPostRepository } from "../application/interfaces/repositories/post-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class PostIndexingPolicy {
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

  async shouldIndex(ctx: TransactionContext, post: Post): Promise<boolean> {
    const level1Result = await this.shouldIndexLevel1(ctx, post);
    if (level1Result) {
      return true;
    }

    if (this.indexLevel === 2) {
      return await this.shouldIndexLevel2(ctx, post);
    }

    return false;
  }

  private async shouldIndexLevel1(
    ctx: TransactionContext,
    post: Post,
  ): Promise<boolean> {
    const isActorSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      post.actorDid,
    );
    if (isActorSubscriber) {
      return true;
    }

    if (post.isReply()) {
      const replyTargetUris = post.getReplyTargetUris();
      for (const targetUri of replyTargetUris) {
        const targetActorDid = await this.postRepository.findActorDidByUri(
          ctx,
          targetUri,
        );
        if (targetActorDid) {
          const isTargetActorSubscriber =
            await this.subscriptionRepository.isSubscriber(ctx, targetActorDid);
          if (isTargetActorSubscriber) {
            return true;
          }
        }
      }
      return false;
    }

    return this.subscriptionRepository.hasSubscriberFollower(
      ctx,
      post.actorDid,
    );
  }

  private async shouldIndexLevel2(
    ctx: TransactionContext,
    post: Post,
  ): Promise<boolean> {
    const replyTargetUris = post.getReplyTargetUris();
    if (replyTargetUris.length === 0) {
      return false;
    }
    return this.postRepository.existsAny(ctx, replyTargetUris);
  }
}
