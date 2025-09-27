import type { Post, TransactionContext } from "@repo/common/domain";

import type { IActorRepository } from "../application/interfaces/repositories/actor-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class PostIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly actorRepository: IActorRepository,
    private readonly indexLevel: number,
  ) {}
  static inject = [
    "subscriptionRepository",
    "actorRepository",
    "indexLevel",
  ] as const;

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

      // Level2: リプライ先がsubscribersのフォロイーなら保存
      if (this.indexLevel === 2) {
        return this.actorRepository.hasFollowedBySubscribers({
          ctx,
          actorDids: targetDids,
        });
      }

      return false;
    }

    // 投稿者がsubscriberなら保存
    const isSubscriber = await this.subscriptionRepository.hasSubscriber(ctx, [
      post.actorDid,
    ]);
    if (isSubscriber) {
      return true;
    }

    // 投稿者がsubscribersのフォロイーなら保存
    const actor = await this.actorRepository.findByDid({
      ctx,
      did: post.actorDid,
    });
    return actor?.isFollowedBySubscriber ?? false;
  }
}
