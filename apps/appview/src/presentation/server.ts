import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import type { Router } from "express";
import express from "express";
import promBundle from "express-prom-bundle";

import { env } from "../shared/env.js";
import { healthRouter } from "./routes/health.js";
import { wellKnownRouter } from "./routes/well-known.js";

export class AppViewServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(loggerManager: ILoggerManager, xrpcRouter: Router) {
    this.logger = loggerManager.createLogger("AppViewServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(promBundle({ includeMethod: true }));
    this.app.use(healthRouter);
    this.app.use(wellKnownRouter);
    this.app.use(xrpcRouter);
  }
  static inject = ["loggerManager", "xrpcRouter"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(`AppView server listening on port ${env.PORT}`);
    });
  }
}
