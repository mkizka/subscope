import { setTimeout } from "node:timers/promises";

import type {
  CommitEventDto,
  IJobQueue,
  ILoggerManager,
  IMetricReporter,
} from "@repo/common/domain";

const MAX_PENDING_COMMIT_JOBS = 100_000;

export class HandleCommitUseCase {
  private readonly logger;
  constructor(
    loggerManager: ILoggerManager,
    private readonly metricReporter: IMetricReporter,
    private readonly jobQueue: IJobQueue,
  ) {
    this.logger = loggerManager.createLogger("HandleCommitUseCase");
  }

  async execute(dto: CommitEventDto) {
    this.logger.debug(
      { did: dto.did },
      `${dto.commit.collection} event received`,
    );
    this.metricReporter.increment("ingester_events_commit_total", {
      collection: dto.commit.collection,
    });

    while (
      (await this.jobQueue.countPending("commit")) >= MAX_PENDING_COMMIT_JOBS
    ) {
      await setTimeout(1000);
    }

    const uri = `at://${dto.did}/${dto.commit.collection}/${dto.commit.rkey}`;
    await this.jobQueue.add({
      queueName: "commit",
      jobName: uri,
      data: dto,
      options: {
        priority: dto.live ? undefined : 1,
        jobId: `${uri}@${dto.commit.rev}`,
      },
    });
  }
}
