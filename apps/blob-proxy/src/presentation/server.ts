import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import type { Router } from "express";
import express from "express";
import promBundle from "express-prom-bundle";

import type { CacheCleanupScheduler } from "../application/services/cache-cleanup-scheduler.js";

export class BlobProxyServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    imagesRouter: Router,
    private readonly cacheCleanupScheduler: CacheCleanupScheduler,
    healthRouter: Router,
    private readonly port: number,
  ) {
    this.logger = loggerManager.createLogger("BlobProxyServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(promBundle({ includeMethod: true }));
    this.app.use(healthRouter);
    this.app.use("/images", imagesRouter);
  }
  static inject = [
    "loggerManager",
    "imagesRouter",
    "cacheCleanupScheduler",
    "healthRouter",
    "port",
  ] as const;

  start() {
    this.app.listen(this.port, () => {
      this.logger.info(`Blob proxy server listening on port ${this.port}`);
      this.cacheCleanupScheduler.start();
    });
  }
}
