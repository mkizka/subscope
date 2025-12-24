import type {
  IdentityEventDto,
  IJobQueue,
  ILoggerManager,
  IMetricReporter,
} from "@repo/common/domain";

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

  async execute(dto: IdentityEventDto) {
    this.logger.debug({ did: dto.identity.did }, "identity event received");
    this.metricReporter.increment("ingester_events_identity_total", {
      change_handle: dto.identity.handle ? "true" : "false",
    });

    await this.jobQueue.add({
      queueName: "identity",
      jobName: `at://${dto.identity.handle ?? dto.identity.did}`,
      data: dto,
    });
  }
}
