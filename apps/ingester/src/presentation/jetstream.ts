import type { ILoggerManager, IMetricReporter } from "@repo/common/domain";
import { required, SUPPORTED_COLLECTIONS } from "@repo/common/utils";
import { Jetstream } from "@skyware/jetstream";
import { setTimeout as sleep } from "timers/promises";
import WebSocket from "ws";

import type { HandleAccountUseCase } from "../application/handle-account-use-case.js";
import type { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import type { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";
import type { ICursorRepository } from "../application/interfaces/cursor-repository.js";
import { env } from "../shared/env.js";

// cursorの変化を監視するための確認間隔
const CONNECTION_CHECK_INTERVAL = 2000;

// 再接続間隔の指数バックオフの最大遅延
const INITIAL_RECONNECT_DELAY = 2000;

// 再接続間隔の指数バックオフの最大値
const MAX_RECONNECT_DELAY = 30000;

// 再接続する際のcloseからstartまでの間隔
const RECONNECT_DELAY = 1000;

export class JetstreamIngester {
  private readonly jetstream;
  private readonly logger;

  // 接続監視のために一定時間でcusorを保存
  private lastCursor: number = 0;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;

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
      await this.cursorRepository.set(event.time_us);
    });

    this.jetstream.on("identity", async (event) => {
      await this.handleIdentityUseCase.execute(event);
      await this.cursorRepository.set(event.time_us);
    });

    this.jetstream.on("commit", async (event) => {
      await this.handleCommitUseCase.execute(event);
      await this.cursorRepository.set(event.time_us);
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

  private shouldReconnect() {
    this.logger.debug(
      {
        cursor: this.jetstream.cursor,
        lastCursor: this.lastCursor,
      },
      "Checking if should reconnect",
    );
    return this.jetstream.cursor === this.lastCursor;
  }

  private async reconnect() {
    this.logger.info(
      { reconnectDelay: this.reconnectDelay },
      `The cursor did not change, so attempting to reconnect`,
    );
    this.metricReporter.setConnectionStateGauge("reconnecting");
    this.jetstream.close();

    // 終了からWebsocketが完全にクローズするまで少し待つ
    await sleep(RECONNECT_DELAY);

    await this.start();
  }

  private scheduleConnectionMonitoring() {
    this.logger.info("Starting connection monitoring");
    this.lastCursor = required(this.jetstream.cursor);

    const intervalId = setInterval(async () => {
      if (this.shouldReconnect()) {
        clearInterval(intervalId);
        await this.reconnect();
      }
      this.lastCursor = required(this.jetstream.cursor);
    }, CONNECTION_CHECK_INTERVAL);
  }

  private nextReconnectDelay() {
    return Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
  }

  private startConnectionMonitoring() {
    setTimeout(async () => {
      // cursorが変化していなければ指数バックオフで再接続
      if (this.shouldReconnect()) {
        this.reconnectDelay = this.nextReconnectDelay();
        await this.reconnect();
      }
      // cursorが変化していれば再接続遅延をリセットしてsetIntervalの監視を開始
      else {
        this.reconnectDelay = INITIAL_RECONNECT_DELAY;
        this.scheduleConnectionMonitoring();
      }
    }, this.reconnectDelay);
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

    this.startConnectionMonitoring();
  }
}
