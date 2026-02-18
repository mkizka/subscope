import type { ILoggerManager } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import express from "express";

import type { CacheCleanupScheduler } from "@/server/features/blob-proxy/application/services/cache-cleanup-scheduler.js";
import { env } from "@/server/shared/env.js";

export class SubscopeServer {
  private readonly logger;
  readonly app;

  constructor(
    loggerManager: ILoggerManager,
    oauthRouter: express.Router,
    blobProxyRouter: express.Router,
    xrpcRouter: express.Router,
    healthRouter: express.Router,
    wellKnownRouter: express.Router,
    clientRouter: express.Router,
    private readonly cacheCleanupScheduler: CacheCleanupScheduler,
  ) {
    const logger = loggerManager.createLogger("SubscopeServer");
    const app = express();

    app.use(loggingMiddleware(logger));
    app.use(express.urlencoded({ extended: true }));

    app.use("/oauth", oauthRouter);
    app.use("/images", blobProxyRouter);
    app.use(xrpcRouter);
    app.use(healthRouter);
    app.use(wellKnownRouter);
    app.use(clientRouter);

    this.logger = logger;
    this.app = app;
  }
  static inject = [
    "loggerManager",
    "oauthRouter",
    "blobProxyRouter",
    "xrpcRouter",
    "healthRouter",
    "wellKnownRouter",
    "clientRouter",
    "cacheCleanupScheduler",
  ] as const;

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(
        `Subscope server running at http://localhost:${env.PORT}`,
      );
      this.cacheCleanupScheduler.start();
    });
  }
}
