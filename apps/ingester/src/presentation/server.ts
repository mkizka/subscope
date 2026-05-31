import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import type { Router } from "express";
import express from "express";

import { env } from "../shared/env.js";
import type { LabelIngester } from "./label.js";
import { healthRouter } from "./routes/health.js";
import type { TapIngester } from "./tap.js";

export class IngesterServer {
  private readonly app: express.Express;
  private readonly logger: Logger;
  private readonly tapIngester: TapIngester;
  private readonly labelIngester: LabelIngester;

  constructor({
    loggerManager,
    metricsRouter,
    tapIngester,
    labelIngester,
  }: {
    loggerManager: ILoggerManager;
    metricsRouter: Router;
    tapIngester: TapIngester;
    labelIngester: LabelIngester;
  }) {
    this.tapIngester = tapIngester;
    this.labelIngester = labelIngester;
    this.logger = loggerManager.createLogger("IngesterServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(healthRouter);
    this.app.use(metricsRouter);
  }

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(`Ingester server listening on port ${env.PORT}`);
      if (!env.DISABLE_INGESTER) {
        void this.tapIngester.start();
        void this.labelIngester.start();
      }
    });
  }
}
