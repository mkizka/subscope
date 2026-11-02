import type { IJobQueue, ITransactionManager } from "@repo/common/domain";

import type { IPostStatsQuery } from "../../interfaces/queries/post-stats-query.js";
import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";

const BATCH_SIZE = 1000;

export class AggregatePostStatsUseCase {
  constructor(
    private readonly postStatsQuery: IPostStatsQuery,
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly jobQueue: IJobQueue,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute() {
    for (;;) {
      const uris = await this.jobQueue.popBatchItems(
        "aggregatePostStats",
        BATCH_SIZE,
      );
      if (uris.length === 0) return;
      try {
        await this.transactionManager.transaction(async (ctx) => {
          const stats = await this.postStatsQuery.countStats({ ctx, uris });
          await this.postStatsRepository.save({ ctx, stats });
        });
      } catch (error) {
        await this.jobQueue.addBatchItems({
          queueName: "aggregatePostStats",
          items: uris,
        });
        throw error;
      }
    }
  }
}
