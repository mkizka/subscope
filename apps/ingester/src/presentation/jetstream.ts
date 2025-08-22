import type { ILoggerManager, IMetricReporter } from "@repo/common/domain";
import { required, SUPPORTED_COLLECTIONS } from "@repo/common/utils";
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
  private startupCheckTimeout?: NodeJS.Timeout;
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
        this.getStatus(),
        `Jetstream subscription started at ${env.JETSTREAM_URL} with cursor ${this.jetstream.cursor}`,
      );
      this.metricReporter.setConnectionStateGauge("opened");
      this.startStartupCheck();
    });

    this.jetstream.on("close", () => {
      this.logger.info(this.getStatus(), `Jetstream subscription closed`);
      this.stopStartupCheck();
      this.stopHealthCheck();
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

  private getStatus() {
    return {
      lastProcessedCursor: this.lastProcessedCursor,
      lastCheckedCursor: this.lastCheckedCursor,
      startupBackoffMs: this.startupBackoffMs,
    };
  }

  private stopStartupCheck() {
    this.logger.info(this.getStatus(), "Stopping startup check");
    if (this.startupCheckTimeout) {
      clearTimeout(this.startupCheckTimeout);
      this.startupCheckTimeout = undefined;
    }
    this.startupBackoffMs = DEFAULT_STARTUP_BACKOFF;
  }

  private stopHealthCheck() {
    this.logger.info(this.getStatus(), "Stopping health check");
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
          this.getStatus(),
          "Startup check: No cursor change detected, initiating reconnection",
        );
        this.startupBackoffMs = Math.min(
          this.startupBackoffMs * 2,
          this.maxStartupBackoffMs,
        );
        void this.reconnect();
      } else {
        this.logger.info(
          this.getStatus(),
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
          this.getStatus(),
          "Health check: No cursor change detected, initiating reconnection",
        );
        this.startupBackoffMs = DEFAULT_STARTUP_BACKOFF;
        void this.reconnect();
      } else {
        this.logger.info(
          this.getStatus(),
          "Health check: Cursor change detected, connection is healthy",
        );
        this.lastCheckedCursor = this.lastProcessedCursor;
        this.metricReporter.setConnectionStateGauge("stable");

        // 意図：イベントごとではなくヘルスチェック通過時にcursorを保存することでRedisへの負荷を抑える
        void this.cursorRepository.set(required(this.lastProcessedCursor));
      }
    }, this.healthCheckIntervalMs);
  }

  private async reconnect() {
    this.jetstream.close();
    this.logger.info(this.getStatus(), "Reconnecting to Jetstream");
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
