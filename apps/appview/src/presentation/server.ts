import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import type { RequestHandler, Router } from "express";
import express from "express";
import promBundle from "express-prom-bundle";

export class AppViewServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    lexRouter: RequestHandler,
    healthRouter: Router,
    wellKnownRouter: Router,
    private readonly port: number,
  ) {
    this.logger = loggerManager.createLogger("AppViewServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(promBundle({ includeMethod: true }));
    this.app.use(healthRouter);
    this.app.use(wellKnownRouter);
    this.app.use(lexRouter);
  }
  static inject = [
    "loggerManager",
    "lexRouter",
    "healthRouter",
    "wellKnownRouter",
    "port",
  ] as const;

  start() {
    this.app.listen(this.port, () => {
      this.logger.info(`AppView server listening on port ${this.port}`);
    });
  }
}
