import type {
  IJobQueue,
  ILoggerManager,
  IMetricReporter,
} from "@dawn/common/domain";
import type { SupportedCollection } from "@dawn/common/utils";
import type { CommitEvent } from "@skyware/jetstream";

export class HandleCommitUseCase {
  private readonly logger;
  constructor(
    loggerManager: ILoggerManager,
    private readonly metricReporter: IMetricReporter,
    private readonly jobQueue: IJobQueue,
  ) {
    this.logger = loggerManager.createLogger("HandleCommitUseCase");
  }
  static inject = ["loggerManager", "metricReporter", "jobQueue"] as const;

  async execute(event: CommitEvent<SupportedCollection>) {
    this.logger.debug(
      { did: event.did },
      `${event.commit.collection} event received`,
    );
    this.metricReporter.increment("ingester_events_commit_total", {
      collection: event.commit.collection,
    });
    this.metricReporter.setTimeDelayGauge(event.time_us);
    await this.jobQueue.add({
      queueName: event.kind,
      jobName: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      data: event,
    });
  }
}
