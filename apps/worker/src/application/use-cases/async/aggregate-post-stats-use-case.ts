import type { IJobQueue, ITransactionManager } from "@repo/common/interface";

import type { IPostStatsQuery } from "../../interfaces/queries/post-stats-query.js";
import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";

const BATCH_SIZE = 1000;

export class AggregatePostStatsUseCase {
  constructor(
    private readonly deps: {
      postStatsQuery: IPostStatsQuery;
      postStatsRepository: IPostStatsRepository;
      jobQueue: IJobQueue;
      transactionManager: ITransactionManager;
    },
  ) {}

  async execute() {
    for (;;) {
      const uris = await this.deps.jobQueue.popBatchItems(
        "aggregatePostStats",
        BATCH_SIZE,
      );
      if (uris.length === 0) return;
      try {
        await this.deps.transactionManager.transaction(async (ctx) => {
          const stats = await this.deps.postStatsQuery.countStats({
            ctx,
            uris,
          });
          await this.deps.postStatsRepository.save({ ctx, stats });
        });
      } catch (error) {
        await this.deps.jobQueue.addBatchItems({
          queueName: "aggregatePostStats",
          items: uris,
        });
        throw error;
      }
    }
  }
}
