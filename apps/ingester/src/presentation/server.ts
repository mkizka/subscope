import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
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
    private readonly ingester: JetstreamIngester,
  ) {
    this.logger = loggerManager.createLogger("IngesterServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(healthRouter);
    this.app.use(metricsRouter);
  }
  static inject = ["loggerManager", "metricsRouter", "ingester"] as const;

  start() {
    this.app.listen(env.PORT, async () => {
      this.logger.info(`Ingester server listening on port ${env.PORT}`);
      if (!env.DISABLE_INGESTER) {
        await this.ingester.start();
      }
    });
  }
}
