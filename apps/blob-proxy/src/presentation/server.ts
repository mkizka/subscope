import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import express from "express";
import promBundle from "express-prom-bundle";

import type { CacheScheduler } from "../application/cache-scheduler.js";
import { env } from "../shared/env.js";
import { healthRouter } from "./routes/health.js";

export class BlobProxyServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    imagesRouter: express.Router,
    private readonly cacheScheduler: CacheScheduler,
  ) {
    this.logger = loggerManager.createLogger("BlobProxyServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(promBundle({ includeMethod: true }));
    this.app.use("/health", healthRouter);
    this.app.use("/images", imagesRouter);
  }
  static inject = ["loggerManager", "imagesRouter", "cacheScheduler"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(`Blob proxy server listening on port ${env.PORT}`);
      this.cacheScheduler.start();
    });
  }
}
