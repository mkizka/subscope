import type { ILoggerManager, IMetricReporter } from "@dawn/common/domain";
import type { SupportedCollection } from "@dawn/common/utils";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { HandleAccountUseCase } from "../application/handle-account-use-case.js";
import type { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import type { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";
import { env } from "../shared/env.js";

export class JetstreamIngester {
  private readonly jetstream;
  private readonly logger;

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
        `jetstream subscription started to ${env.JETSTREAM_URL}`,
      );
      this.metricReporter.setConnectionStateGauge("open");
    });

    this.jetstream.on("close", () => {
      this.logger.info(`jetstream subscription closed`);
      this.metricReporter.setConnectionStateGauge("close");
    });

    this.jetstream.on("error", (error) => {
      this.logger.error(error, "jetstream error occurred");
      this.metricReporter.setConnectionStateGauge("error");
    });

    this.jetstream.on("account", async (event) => {
      await this.handleAccountUseCase.execute(event);
    });

    this.jetstream.on("identity", async (event) => {
      await this.handleIdentityUseCase.execute(event);
    });

    this.jetstream.on("commit", async (event) => {
      await this.handleCommitUseCase.execute(event);
    });
  }
  static inject = [
    "loggerManager",
    "metricReporter",
    "handleAccountUseCase",
    "handleIdentityUseCase",
    "handleCommitUseCase",
  ] as const;

  start() {
    this.jetstream.start();
  }
}
