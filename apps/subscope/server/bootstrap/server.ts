import type { ILoggerManager } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import type { RequestHandler } from "express";
import express from "express";

import type { CacheCleanupScheduler } from "@/server/features/blob-proxy/application/services/cache-cleanup-scheduler.js";
import { env } from "@/server/shared/env.js";

export class SubscopeServer {
  private readonly logger;
  private readonly app;
  private _initialized = false;

  constructor(
    loggerManager: ILoggerManager,
    authMiddleware: RequestHandler,
    dashboardRouter: express.Router,
    oauthRouter: express.Router,
    blobProxyRouter: express.Router,
    xrpcRouter: express.Router,
    healthRouter: express.Router,
    wellKnownRouter: express.Router,
    private readonly clientRouter: Promise<express.Router>,
    private readonly cacheCleanupScheduler: CacheCleanupScheduler,
  ) {
    const logger = loggerManager.createLogger("SubscopeServer");
    const app = express();

    app.use(loggingMiddleware(logger));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 開発環境でのOAuthログイン時 http://127.0.0.1/oauth/callback にリダイレクトされるので、
    // そこからさらにPUBLIC_URLにリダイレクトさせる
    app.use((req, res, next) => {
      if (env.NODE_ENV === "development" && req.hostname === "127.0.0.1") {
        res.redirect(new URL(req.originalUrl, env.PUBLIC_URL).toString());
      } else {
        next();
      }
    });

    app.use("/oauth", oauthRouter);
    app.use("/dashboard", authMiddleware, dashboardRouter);
    app.use("/images", blobProxyRouter);
    app.use(xrpcRouter);
    app.use(healthRouter);
    app.use(wellKnownRouter);

    this.logger = logger;
    this.app = app;
  }
  static inject = [
    "loggerManager",
    "authMiddleware",
    "dashboardRouter",
    "oauthRouter",
    "blobProxyRouter",
    "xrpcRouter",
    "healthRouter",
    "wellKnownRouter",
    "clientRouter",
    "cacheCleanupScheduler",
  ] as const;

  async init() {
    if (this._initialized) return;
    this._initialized = true;
    this.app.use(await this.clientRouter);
  }

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(
        `Subscope server running at http://localhost:${env.PORT}`,
      );
      this.cacheCleanupScheduler.start();
    });
  }
}
