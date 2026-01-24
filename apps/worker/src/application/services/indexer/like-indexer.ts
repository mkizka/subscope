import type {
  IJobScheduler,
  Record,
  TransactionContext,
} from "@repo/common/domain";
import { Like } from "@repo/common/domain";

import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class LikeIndexer implements ICollectionIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}
  static inject = ["likeRepository", "jobScheduler"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const like = Like.from(record);
    await this.likeRepository.upsert({ ctx, like });
  }

  async afterAction({ record }: { record: Record }): Promise<void> {
    const like = Like.from(record);
    await this.jobScheduler.scheduleAggregatePostStats(like.subjectUri, "like");
  }
}
