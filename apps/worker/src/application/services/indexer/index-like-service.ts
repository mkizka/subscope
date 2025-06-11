import type { Record, TransactionContext } from "@repo/common/domain";
import { Like } from "@repo/common/domain";

import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { IIndexCollectionService } from "../../interfaces/services/index-collection-service.js";

export class IndexLikeService implements IIndexCollectionService {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly postRepository: IPostRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = [
    "likeRepository",
    "postRepository",
    "subscriptionRepository",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const like = Like.from(record);
    await this.likeRepository.upsert({ ctx, like });
  }

  async shouldSave({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const like = Like.from(record);

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
