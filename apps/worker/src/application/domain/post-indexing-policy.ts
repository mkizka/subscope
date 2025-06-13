import type { Post, TransactionContext } from "@repo/common/domain";

import type { IPostRepository } from "../interfaces/repositories/post-repository.js";
import type { ISubscriptionRepository } from "../interfaces/repositories/subscription-repository.js";

export class PostIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly postRepository: IPostRepository,
  ) {}
  static inject = ["subscriptionRepository", "postRepository"] as const;

  async shouldIndex(ctx: TransactionContext, post: Post): Promise<boolean> {
    // subscribers本人の投稿は保存
    const isActorSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      post.actorDid,
    );
    if (isActorSubscriber) {
      return true;
    }

    // リプライの場合：リプライ先またはリプライルートの投稿がDB上にあれば保存
    if (post.isReply()) {
      const replyTargetUris = post.getReplyTargetUris();
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

    // 通常投稿：投稿者のフォロワーが1人以上subscribersなら保存
    return await this.subscriptionRepository.hasSubscriberFollower(
      ctx,
      post.actorDid,
    );
  }
}
