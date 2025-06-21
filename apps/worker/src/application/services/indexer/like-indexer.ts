import type { Record, TransactionContext } from "@repo/common/domain";
import { Like } from "@repo/common/domain";

import type { LikeIndexingPolicy } from "../../../domain/like-indexing-policy.js";
import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class LikeIndexer implements ICollectionIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly likeIndexingPolicy: LikeIndexingPolicy,
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly postRepository: IPostRepository,
  ) {}
  static inject = [
    "likeRepository",
    "likeIndexingPolicy",
    "postStatsRepository",
    "postRepository",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const like = Like.from(record);
    await this.likeRepository.upsert({ ctx, like });
  }

  async shouldIndex({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const like = Like.from(record);
    return await this.likeIndexingPolicy.shouldIndex(ctx, like);
  }

  async updateStats({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<void> {
    const like = Like.from(record);

    // 対象の投稿が存在する場合のみstatsを更新
    const postExists = await this.postRepository.exists(
      ctx,
      like.subjectUri.toString(),
    );
    if (postExists) {
      await this.postStatsRepository.upsertLikeCount({
        ctx,
        uri: like.subjectUri,
      });
    }
  }
}
