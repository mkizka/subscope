import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import type { Router } from "express";
import express from "express";

export class IngesterServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly port: number,
    metricsRouter: Router,
    healthRouter: Router,
  ) {
    this.logger = loggerManager.createLogger("IngesterServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(healthRouter);
    this.app.use(metricsRouter);
  }

  start() {
    this.app.listen(this.port, () => {
      this.logger.info(`Ingester server listening on port ${this.port}`);
    });
  }
}
