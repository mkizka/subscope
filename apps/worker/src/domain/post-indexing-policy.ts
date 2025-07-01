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
    const isActorSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      post.actorDid,
    );
    if (isActorSubscriber) {
      return true;
    }

    if (post.isReply()) {
      // リプライしたポストの作成者がsubscribersなら保存
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

      if (this.indexLevel === 2) {
        if (replyTargetUris.length > 0) {
          const replyTargetExists = await this.postRepository.existsAny(
            ctx,
            replyTargetUris,
          );
          if (replyTargetExists) {
            return true;
          }
        }
      }
    } else {
      return await this.subscriptionRepository.hasSubscriberFollower(
        ctx,
        post.actorDid,
      );
    }

    return false;
  }
}
