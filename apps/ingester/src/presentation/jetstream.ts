import type { ILoggerManager, IMetricReporter } from "@repo/common/domain";
import { SUPPORTED_COLLECTIONS } from "@repo/common/utils";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { HandleAccountUseCase } from "../application/handle-account-use-case.js";
import type { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import type { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";
import type { ICursorRepository } from "../application/interfaces/cursor-repository.js";
import { env } from "../shared/env.js";

const DEFAULT_STARTUP_BACKOFF = 1000;

export class JetstreamIngester {
  private readonly jetstream;
  private readonly logger;

  private lastProcessedCursor: number | null = null;
  private lastCheckedCursor: number | null = null;

  // startupCheck
  //   起動後にcursorが変化して新しいイベントを受け続けていることを確認するチェック
  //   setTimeoutの再帰処理によって実行されるのでtimeoutは保持しない
  private startupBackoffMs = DEFAULT_STARTUP_BACKOFF;
  private readonly maxStartupBackoffMs = 60000;

  // healthCheck
  //   startupCheck通過後に定期的にcursorが変化しているかを確認するチェック
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
        { cursor: this.jetstream.cursor },
        `Jetstream subscription started at ${env.JETSTREAM_URL} with cursor ${this.jetstream.cursor}`,
      );
      this.metricReporter.setConnectionStateGauge("open");
      this.startStartupCheck();
    });

    this.jetstream.on("close", () => {
      this.logger.info(`Jetstream subscription closed`);
      this.metricReporter.setConnectionStateGauge("close");
    });

    this.jetstream.on("error", (error) => {
      this.logger.error(error, "Jetstream error occurred");
      this.metricReporter.setConnectionStateGauge("error");
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

  private stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  private startStartupCheck() {
    this.lastCheckedCursor = this.lastProcessedCursor;
    this.scheduleStartupCheck();
  }

  private scheduleStartupCheck() {
    setTimeout(() => {
      if (this.lastProcessedCursor === this.lastCheckedCursor) {
        this.logger.warn(
          { backoff: this.startupBackoffMs },
          "Startup check: No cursor change detected, initiating reconnection",
        );
        this.startupBackoffMs = Math.min(
          this.startupBackoffMs * 2,
          this.maxStartupBackoffMs,
        );
        void this.reconnect();
      } else {
        this.logger.info(
          "Startup check: Cursor change detected, startup complete",
        );
        this.startHealthCheck();
      }
    }, this.startupBackoffMs);
  }

  private startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      if (this.lastProcessedCursor === this.lastCheckedCursor) {
        this.logger.warn(
          "Health check: No cursor change detected, initiating reconnection",
        );
        this.startupBackoffMs = DEFAULT_STARTUP_BACKOFF;
        void this.reconnect();
      } else {
        this.logger.info(
          "Health check: Cursor change detected, connection is healthy",
        );
        this.lastCheckedCursor = this.lastProcessedCursor;
      }
    }, this.healthCheckIntervalMs);
  }

  private async reconnect() {
    this.stopHealthCheck();
    this.jetstream.close();

    this.logger.info("Reconnecting to Jetstream");
    await this.start();
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
