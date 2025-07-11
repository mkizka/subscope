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
    // actorがsubscriberかチェック
    const isActorSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      post.actorDid,
    );
    if (isActorSubscriber) {
      return true;
    }

    // リプライの場合の処理
    if (post.isReply()) {
      const replyTargetUris = post.getReplyTargetUris();
      for (const targetUri of replyTargetUris) {
        const targetActorDid = await this.postRepository.findActorDidByUri(
          ctx,
          targetUri,
        );
        if (targetActorDid) {
          // Level1: リプライ先がsubscriberかチェック
          const isTargetActorSubscriber =
            await this.subscriptionRepository.isSubscriber(ctx, targetActorDid);
          if (isTargetActorSubscriber) {
            return true;
          }

          // Level2: リプライ先がsubscribersのフォロイーかチェック
          if (this.indexLevel === 2) {
            const isFollowedBySubscriber =
              await this.subscriptionRepository.hasSubscriberFollower(
                ctx,
                targetActorDid,
              );
            if (isFollowedBySubscriber) {
              return true;
            }
          }
        }
      }
      return false;
    }

    // 非リプライの場合: subscribersのフォロイーかチェック
    return this.subscriptionRepository.hasSubscriberFollower(
      ctx,
      post.actorDid,
    );
  }
}
