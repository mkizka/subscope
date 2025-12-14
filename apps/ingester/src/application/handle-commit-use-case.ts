import type {
  CommitEventDto,
  IJobQueue,
  ILoggerManager,
  IMetricReporter,
} from "@repo/common/domain";
import type { SupportedCollection } from "@repo/common/utils";
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

    const dto: CommitEventDto =
      event.commit.operation === "delete"
        ? {
            did: event.did,
            time_us: event.time_us,
            commit: {
              operation: event.commit.operation,
              collection: event.commit.collection,
              rkey: event.commit.rkey,
            },
          }
        : {
            did: event.did,
            time_us: event.time_us,
            commit: {
              operation: event.commit.operation,
              collection: event.commit.collection,
              rkey: event.commit.rkey,
              record: event.commit.record,
              cid: event.commit.cid,
            },
          };

    await this.jobQueue.add({
      queueName: "commit",
      jobName: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      data: dto,
    });
  }
}
