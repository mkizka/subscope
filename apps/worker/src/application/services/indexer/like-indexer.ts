import type { Record, TransactionContext } from "@repo/common/domain";
import { Like } from "@repo/common/domain";

import type { LikeIndexingPolicy } from "../../../domain/like-indexing-policy.js";
import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class LikeIndexer implements ICollectionIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly likeIndexingPolicy: LikeIndexingPolicy,
    private readonly postStatsRepository: IPostStatsRepository,
  ) {}
  static inject = [
    "likeRepository",
    "likeIndexingPolicy",
    "postStatsRepository",
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
    await this.postStatsRepository.upsertLikeCount({
      ctx,
      uri: like.subjectUri,
    });
  }
}
