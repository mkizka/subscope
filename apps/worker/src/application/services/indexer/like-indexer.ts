import type { Record, TransactionContext } from "@repo/common/domain";
import { Like } from "@repo/common/domain";

import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type {
  ICollectionIndexer,
  IndexingContext,
} from "../../interfaces/services/index-collection-service.js";
import type { AggregatePostStatsScheduler } from "../scheduler/aggregate-post-stats-scheduler.js";

export class LikeIndexer implements ICollectionIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly aggregatePostStatsScheduler: AggregatePostStatsScheduler,
  ) {}
  static inject = ["likeRepository", "aggregatePostStatsScheduler"] as const;

  async upsert({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
    indexingCtx: IndexingContext;
  }) {
    const like = Like.from(record);
    await this.likeRepository.upsert({ ctx, like });
  }

  async afterAction({ record }: { record: Record }): Promise<void> {
    const like = Like.from(record);
    await this.aggregatePostStatsScheduler.schedule(like.subjectUri, "like");
  }
}
