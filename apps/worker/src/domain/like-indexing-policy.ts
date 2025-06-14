import type { Like, TransactionContext } from "@repo/common/domain";

import type { IPostRepository } from "../application/interfaces/repositories/post-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class LikeIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly postRepository: IPostRepository,
  ) {}
  static inject = ["subscriptionRepository", "postRepository"] as const;

  async shouldIndex(ctx: TransactionContext, like: Like): Promise<boolean> {
    // いいねしたユーザーがsubscriberなら保存
    const isLikerSubscriber =
      await this.subscriptionRepository.hasAnySubscriber(ctx, [like.actorDid]);
    if (isLikerSubscriber) {
      return true;
    }

    // いいねされた投稿がDBに存在すれば保存（投稿の保存ルールを通った投稿のみDBにあるため）
    return this.postRepository.existsAny(ctx, [like.subjectUri.toString()]);
  }
}
