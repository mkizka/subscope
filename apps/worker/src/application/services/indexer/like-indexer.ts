import type { Record, TransactionContext } from "@repo/common/domain";
import { Like } from "@repo/common/domain";

import type { LikeIndexingPolicy } from "../../../domain/like-indexing-policy.js";
import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { AggregatePostStatsScheduler } from "../scheduler/aggregate-post-stats-scheduler.js";

export class LikeIndexer implements ICollectionIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly likeIndexingPolicy: LikeIndexingPolicy,
    private readonly aggregatePostStatsScheduler: AggregatePostStatsScheduler,
  ) {}
  static inject = [
    "likeRepository",
    "likeIndexingPolicy",
    "aggregatePostStatsScheduler",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const like = Like.from(record);
    await this.likeRepository.upsert({ ctx, like });
  }

  async shouldIndex({
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const like = Like.from(record);
    return await this.likeIndexingPolicy.shouldIndex(like);
  }

  async afterAction({ record }: { record: Record }): Promise<void> {
    const like = Like.from(record);
    await this.aggregatePostStatsScheduler.schedule(like.subjectUri, "like");
  }
}
