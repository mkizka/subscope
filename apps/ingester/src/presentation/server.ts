import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/infrastructure";
import type { Router } from "express";
import express from "express";

import { env } from "../shared/env.js";
import type { JetstreamIngester } from "./jetstream.js";
import { healthRouter } from "./routes/health.js";

export class IngesterServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    metricsRouter: Router,
    dashboardRouter: Router,
    private readonly ingester: JetstreamIngester,
  ) {
    this.logger = loggerManager.createLogger("IngesterServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(healthRouter);
    this.app.use(metricsRouter);
    this.app.use(dashboardRouter);
  }
  static inject = [
    "loggerManager",
    "metricsRouter",
    "dashboardRouter",
    "ingester",
  ] as const;

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(`Ingester server listening on port ${env.PORT}`);
      if (!env.DISABLE_INGESTER) {
        this.ingester.start();
      }
    });
  }
}
