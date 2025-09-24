import type { ILoggerManager, IMetricReporter } from "@repo/common/domain";
import { required, SUPPORTED_COLLECTIONS } from "@repo/common/utils";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { HandleAccountUseCase } from "../application/handle-account-use-case.js";
import type { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import type { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";
import type { ICursorRepository } from "../application/interfaces/cursor-repository.js";
import { env } from "../shared/env.js";

export class JetstreamIngester {
  private readonly jetstream;
  private readonly logger;

  private lastProcessedCursor: number | null = null;
  private lastCheckedCursor: number | null = null;

  private healthCheckInterval?: NodeJS.Timeout;
  private readonly healthCheckIntervalMs = 30000;

  constructor(
    loggerManager: ILoggerManager,
    private readonly metricReporter: IMetricReporter,
    private readonly handleAccountUseCase: HandleAccountUseCase,
    private readonly handleIdentityUseCase: HandleIdentityUseCase,
    private readonly handleCommitUseCase: HandleCommitUseCase,
    private readonly cursorRepository: ICursorRepository,
  ) {
    this.logger = loggerManager.createLogger("JetstreamIngester");
    this.jetstream = new Jetstream({
      ws: WebSocket,
      endpoint: env.JETSTREAM_URL,
      wantedCollections: SUPPORTED_COLLECTIONS,
    });

    this.jetstream.on("open", () => {
      this.logger.info(
        `Jetstream subscription started at ${env.JETSTREAM_URL} with cursor ${this.jetstream.cursor}`,
      );
      this.metricReporter.setConnectionStateGauge("opened");

      this.startHealthCheck();
    });

    this.jetstream.on("close", () => {
      this.logger.info("Jetstream subscription closed");
      this.metricReporter.setConnectionStateGauge("closed");
    });

    this.jetstream.on("error", (error) => {
      this.logger.error(error, "Jetstream error occurred");
    });

    this.jetstream.on("account", async (event) => {
      await this.handleAccountUseCase.execute(event);
      this.lastProcessedCursor = event.time_us;
    });

    this.jetstream.on("identity", async (event) => {
      await this.handleIdentityUseCase.execute(event);
      this.lastProcessedCursor = event.time_us;
    });

    this.jetstream.on("commit", async (event) => {
      await this.handleCommitUseCase.execute(event);
      this.lastProcessedCursor = event.time_us;
    });
  }
  static inject = [
    "loggerManager",
    "metricReporter",
    "handleAccountUseCase",
    "handleIdentityUseCase",
    "handleCommitUseCase",
    "cursorRepository",
  ] as const;

  private startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      if (this.lastProcessedCursor === this.lastCheckedCursor) {
        this.logger.warn("HealthCheck: No cursor change detected");

        // Websocketのクローズ処理が完了するより前に次のインターバルが来る可能性があるので
        // 失敗と分かったらすぐ終了しておく
        clearInterval(this.healthCheckInterval);

        required(this.jetstream.ws).reconnect();
      } else {
        this.logger.info(
          "HealthCheck: Cursor change detected, connection is healthy",
        );

        this.lastCheckedCursor = this.lastProcessedCursor;
        this.metricReporter.setConnectionStateGauge("stable");

        // 意図：イベントごとではなくヘルスチェック通過時にcursorを保存することでRedisへの負荷を抑える
        void this.cursorRepository.set(required(this.lastProcessedCursor));
      }
    }, this.healthCheckIntervalMs);
  }

  private async getCursor() {
    const savedCursor = await this.cursorRepository.get();
    if (!savedCursor && env.NODE_ENV === "development") {
      return -1;
    }
    return savedCursor;
  }

  async start() {
    const cursor = await this.getCursor();
    if (cursor !== null) {
      this.jetstream.cursor = cursor;
    }
    this.jetstream.start();
  }
}
