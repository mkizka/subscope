import type { ILoggerManager, IMetricReporter } from "@dawn/common/domain";
import { required, type SupportedCollection } from "@dawn/common/utils";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { HandleAccountUseCase } from "../application/handle-account-use-case.js";
import type { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import type { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";
import { env } from "../shared/env.js";

const CONNECTION_CHECK_INTERVAL = 2000;
const INITIAL_RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30000;

export class JetstreamIngester {
  private readonly jetstream;
  private readonly logger;

  private lastCursor: number = 0;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;

  constructor(
    loggerManager: ILoggerManager,
    private readonly metricReporter: IMetricReporter,
    private readonly handleAccountUseCase: HandleAccountUseCase,
    private readonly handleIdentityUseCase: HandleIdentityUseCase,
    private readonly handleCommitUseCase: HandleCommitUseCase,
  ) {
    this.logger = loggerManager.createLogger("JetstreamIngester");
    this.jetstream = new Jetstream({
      ws: WebSocket,
      cursor: env.NODE_ENV === "development" ? -1 : undefined,
      endpoint: env.JETSTREAM_URL,
      wantedCollections: [
        "app.bsky.actor.profile",
        "app.bsky.feed.post",
      ] satisfies SupportedCollection[],
    });

    this.jetstream.on("open", () => {
      this.logger.info(
        { cursor: this.jetstream.cursor },
        `Jetstream subscription started at ${env.JETSTREAM_URL}`,
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
      this.jetstream.cursor = event.time_us;
    });

    this.jetstream.on("identity", async (event) => {
      await this.handleIdentityUseCase.execute(event);
      this.jetstream.cursor = event.time_us;
    });

    this.jetstream.on("commit", async (event) => {
      await this.handleCommitUseCase.execute(event);
      this.jetstream.cursor = event.time_us;
    });
  }
  static inject = [
    "loggerManager",
    "metricReporter",
    "handleAccountUseCase",
    "handleIdentityUseCase",
    "handleCommitUseCase",
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

  private reconnect() {
    this.logger.info(
      { reconnectDelay: this.reconnectDelay },
      `The cursor did not change, so attempting to reconnect`,
    );
    this.jetstream.close();
    this.start();
  }

  private startConnectionMonitoring() {
    this.logger.info("Starting connection monitoring");
    this.lastCursor = required(this.jetstream.cursor);
    const intervalId = setInterval(() => {
      if (this.shouldReconnect()) {
        clearInterval(intervalId);
        this.reconnect();
      }
      this.lastCursor = required(this.jetstream.cursor);
    }, CONNECTION_CHECK_INTERVAL);
  }

  private nextReconnectDelay() {
    return Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
  }

  /**
   * Starts the Jetstream connection and performs an initial health check.
   * - After starting, it checks if the cursor has changed.
   * - If the cursor remains the same, it assumes a connection failure and attempts a reconnect with an exponential backoff delay.
   * - If the cursor updates normally, it resets the reconnect delay and starts periodic connection monitoring.
   */
  start() {
    this.jetstream.start();
    setTimeout(() => {
      if (this.shouldReconnect()) {
        this.reconnectDelay = this.nextReconnectDelay();
        this.reconnect();
      } else {
        this.reconnectDelay = INITIAL_RECONNECT_DELAY;
        this.startConnectionMonitoring();
      }
    }, this.reconnectDelay);
  }
}
