import type {
  CommitEventDto,
  IJobQueue,
  ILoggerManager,
  IMetricReporter,
} from "@repo/common/domain";

export class HandleCommitUseCase {
  private readonly logger;
  private readonly metricReporter: IMetricReporter;
  private readonly jobQueue: IJobQueue;

  constructor({
    loggerManager,
    metricReporter,
    jobQueue,
  }: {
    loggerManager: ILoggerManager;
    metricReporter: IMetricReporter;
    jobQueue: IJobQueue;
  }) {
    this.metricReporter = metricReporter;
    this.jobQueue = jobQueue;
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

    await this.jobQueue.add({
      queueName: "commit",
      jobName: `at://${dto.did}/${dto.commit.collection}/${dto.commit.rkey}`,
      data: dto,
      options: { priority: dto.live ? undefined : 1 },
    });
  }
}
