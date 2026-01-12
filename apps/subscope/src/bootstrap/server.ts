import type { ILoggerManager } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import type { RequestHandler } from "express";
import express from "express";

import type { CacheCleanupScheduler } from "../features/blob-proxy/application/services/cache-cleanup-scheduler.js";
import { env } from "../shared/env.js";

export class SubscopeServer {
  private readonly logger;
  private readonly app;

  constructor(
    loggerManager: ILoggerManager,
    authMiddleware: RequestHandler,
    dashboardRouter: express.Router,
    oauthRouter: express.Router,
    clientRouter: express.Router,
    blobProxyRouter: express.Router,
    trpcRouter: express.Router,
    xrpcRouter: express.Router,
    healthRouter: express.Router,
    wellKnownRouter: express.Router,
    private readonly cacheCleanupScheduler: CacheCleanupScheduler,
  ) {
    const logger = loggerManager.createLogger("SubscopeServer");
    const app = express();
    app.use(loggingMiddleware(logger));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use("/oauth", oauthRouter);
    app.use("/dashboard", authMiddleware, dashboardRouter);
    app.use("/images", blobProxyRouter);
    app.use("/trpc", trpcRouter);
    app.use(xrpcRouter);
    app.use(healthRouter);
    app.use(wellKnownRouter);
    app.use(clientRouter);

    this.logger = logger;
    this.app = app;
  }
  static inject = [
    "loggerManager",
    "authMiddleware",
    "dashboardRouter",
    "oauthRouter",
    "clientRouter",
    "blobProxyRouter",
    "trpcRouter",
    "xrpcRouter",
    "healthRouter",
    "wellKnownRouter",
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
