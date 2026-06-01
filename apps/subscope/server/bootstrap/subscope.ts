import type { ILoggerManager } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import express from "express";

import { env } from "@/server/shared/env.js";
import { healthRouter } from "@/server/shared/health.js";

export class SubscopeServer {
  private readonly logger;
  readonly app;

  constructor(loggerManager: ILoggerManager, clientRouter: express.Router) {
    const logger = loggerManager.createLogger("SubscopeServer");
    const app = express();

    app.use(loggingMiddleware(logger));

    app.use(healthRouter);
    app.use(clientRouter);

    this.logger = logger;
    this.app = app;
  }
  static inject = ["loggerManager", "clientRouter"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(`Production server running at ${env.PUBLIC_URL}`);
    });
  }
}
