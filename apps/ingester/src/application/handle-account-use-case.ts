import type {
  IJobQueue,
  ILoggerManager,
  IMetricReporter,
} from "@repo/common/domain";
import type { AccountEvent } from "@skyware/jetstream";

export class HandleAccountUseCase {
  private readonly logger;
  constructor(
    loggerManager: ILoggerManager,
    private readonly metricReporter: IMetricReporter,
    private readonly jobQueue: IJobQueue,
  ) {
    this.logger = loggerManager.createLogger("HandleAccountUseCase");
  }
  static inject = ["loggerManager", "metricReporter", "jobQueue"] as const;

  // イベントを発行するサービスでアカウント ホスティング ステータスが変更された可能性があること、および新しいステータスが何であるかを示します。
  // たとえば、アカウントの作成、削除、または一時停止の結果である可能性があります。イベントは、変更された内容ではなく、現在のホスティング ステータスを説明します。
  // https://atproto.com/ja/specs/sync
  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(event: AccountEvent) {
    this.logger.debug({ did: event.account.did }, "account event received");
    this.metricReporter.increment("ingester_events_account_total");
    this.metricReporter.setTimeDelayGauge(event.time_us);
    // TODO: アカウントステータスの変動を実装
  }
}
