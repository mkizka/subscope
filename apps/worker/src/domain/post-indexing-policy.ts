import type { Post, TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class PostIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly indexLevel: number,
  ) {}
  static inject = ["subscriptionRepository", "indexLevel"] as const;

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
        // Level1: リプライ先がsubscriberかチェック
        const isTargetActorSubscriber =
          await this.subscriptionRepository.isSubscriber(
            ctx,
            targetUri.hostname,
          );
        if (isTargetActorSubscriber) {
          return true;
        }

        // Level2: リプライ先がsubscribersのフォロイーかチェック
        if (this.indexLevel === 2) {
          const isFollowedBySubscriber =
            await this.subscriptionRepository.hasSubscriberFollower(
              ctx,
              targetUri.hostname,
            );
          if (isFollowedBySubscriber) {
            return true;
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
