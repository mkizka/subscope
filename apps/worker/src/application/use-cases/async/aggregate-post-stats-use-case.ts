import type { IJobQueue, ITransactionManager } from "@repo/common/domain";

import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";

const BATCH_SIZE = 1000;

export class AggregatePostStatsUseCase {
  constructor(
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
        await this.transactionManager.transaction((ctx) =>
          this.postStatsRepository.upsertMany({ ctx, uris }),
        );
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
