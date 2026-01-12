import type { RequestHandler } from "express";
import express from "express";

import type { CacheCleanupScheduler } from "../features/blob-proxy/application/services/cache-cleanup-scheduler.js";
import { env } from "../shared/env.js";

export class SubscopeServer {
  private app;

  constructor(
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
    const app = express();

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

    this.app = app;
  }
  static inject = [
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
      // eslint-disable-next-line no-console
      console.log(`Subscope server running at http://localhost:${env.PORT}`);
      this.cacheCleanupScheduler.start();
    });
  }
}
