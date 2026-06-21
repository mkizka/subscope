import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import type { Router } from "express";
import express from "express";

import type { LabelIngester } from "./label.js";
import type { TapIngester } from "./tap.js";

export class IngesterServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly port: number,
    private readonly disableIngester: boolean,
    metricsRouter: Router,
    healthRouter: Router,
    private readonly tapIngester: TapIngester,
    private readonly labelIngester: LabelIngester,
  ) {
    this.logger = loggerManager.createLogger("IngesterServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(healthRouter);
    this.app.use(metricsRouter);
  }
  static inject = [
    "loggerManager",
    "port",
    "disableIngester",
    "metricsRouter",
    "healthRouter",
    "tapIngester",
    "labelIngester",
  ] as const;

  start() {
    this.app.listen(this.port, () => {
      this.logger.info(`Ingester server listening on port ${this.port}`);
      if (!this.disableIngester) {
        this.tapIngester.start().catch((err: unknown) => {
          this.logger.error({ err }, "Tap ingester threw");
        });
        this.labelIngester.start().catch((err: unknown) => {
          this.logger.error({ err }, "Label ingester threw");
        });
      }
    });
  }
}
