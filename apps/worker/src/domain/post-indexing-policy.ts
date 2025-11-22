import type { Post, TransactionContext } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class PostIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async shouldIndex(ctx: TransactionContext, post: Post): Promise<boolean> {
    // リプライの場合の処理
    if (post.isReply()) {
      const targetDids = post.getReplyTargetUris().map((uri) => uri.hostname);

      // 投稿者またはリプライ先のいずれかがsubscriberなら保存
      const hasAnySubscriber = await this.subscriptionRepository.hasSubscriber(
        ctx,
        [post.actorDid, ...targetDids],
      );
      if (hasAnySubscriber) {
        return true;
      }

      // リプライ先がsubscribersのフォロイーなら保存
      return this.subscriptionRepository.hasFolloweeOfSubscribers(
        ctx,
        targetDids,
      );
    }

    // 投稿者がsubscriberなら保存
    const isSubscriber = await this.subscriptionRepository.hasSubscriber(ctx, [
      post.actorDid,
    ]);
    if (isSubscriber) {
      return true;
    }

    // 投稿者がsubscribersのフォロイーなら保存
    return this.subscriptionRepository.hasFolloweeOfSubscribers(ctx, [
      post.actorDid,
    ]);
  }
}
