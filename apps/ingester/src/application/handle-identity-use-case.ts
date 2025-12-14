import type {
  IdentityEventDto,
  IJobQueue,
  ILoggerManager,
  IMetricReporter,
} from "@repo/common/domain";
import type { IdentityEvent } from "@skyware/jetstream";

export class HandleIdentityUseCase {
  private readonly logger;
  constructor(
    loggerManager: ILoggerManager,
    private readonly metricReporter: IMetricReporter,
    private readonly jobQueue: IJobQueue,
  ) {
    this.logger = loggerManager.createLogger("HandleIdentityUseCase");
  }
  static inject = ["loggerManager", "metricReporter", "jobQueue"] as const;

  // 指定された ID (DID ドキュメントまたはハンドル) に変更があった可能性があること、およびオプションで現在のハンドルが何であるかを示します。
  // 何が変更されたかを示すものではなく、ID の現在の状態が何であるかを確実に示すものでもありません。
  // https://atproto.com/ja/specs/sync
  async execute(event: IdentityEvent) {
    this.logger.debug({ did: event.identity.did }, "identity event received");
    this.metricReporter.increment("ingester_events_identity_total", {
      change_handle: event.identity.handle ? "true" : "false",
    });
    this.metricReporter.setTimeDelayGauge(event.time_us);

    const dto: IdentityEventDto = {
      time_us: event.time_us,
      identity: {
        did: event.identity.did,
        handle: event.identity.handle,
      },
    };
    await this.jobQueue.add({
      queueName: "identity",
      jobName: `at://${event.identity.handle ?? event.did}`,
      data: dto,
    });
  }
}
