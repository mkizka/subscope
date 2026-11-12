import type { ILoggerManager, Logger } from "@repo/common/interface";
import { loggingMiddleware } from "@repo/common/utils";
import type { RequestHandler, Router } from "express";
import express from "express";
import promBundle from "express-prom-bundle";

import type { Env } from "../shared/env.js";

export class AppViewServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    lexRouter: RequestHandler,
    healthRouter: Router,
    wellKnownRouter: Router,
    private readonly port: number,
    env: Pick<Env, "NODE_ENV">,
  ) {
    this.logger = loggerManager.createLogger("AppViewServer");
    this.app = express();
    this.app.use(
      loggingMiddleware(this.logger, env.NODE_ENV === "development"),
    );
    this.app.use(promBundle({ includeMethod: true }));
    this.app.use(healthRouter);
    this.app.use(wellKnownRouter);
    this.app.use(lexRouter);
  }

  start() {
    this.app.listen(this.port, () => {
      this.logger.info(`AppView server listening on port ${this.port}`);
    });
  }
}
