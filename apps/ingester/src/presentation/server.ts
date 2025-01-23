import type { ILoggerManager, Logger } from "@dawn/common/domain";
import express from "express";
import promBundle from "express-prom-bundle";
import { pinoHttp } from "pino-http";

import type { JetstreamIngester } from "../infrastructure/atproto/jetstream-ingester.js";
import { env } from "../shared/env.js";
import { healthRouter } from "./routes/health.js";

const noop = () => {};

export class IngesterServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly ingester: JetstreamIngester,
  ) {
    this.logger = loggerManager.createLogger("IngesterServer");
    this.app = express();
    this.app.use(promBundle({ includeMethod: true }));
    this.app.use(
      pinoHttp({
        logger: this.logger,
        customSuccessMessage: (req, res, responseTime) => {
          return `${req.method} ${res.statusCode} ${req.url} ${responseTime}ms`;
        },
        customErrorMessage: (req, res) => {
          return `${req.method} ${res.statusCode} ${req.url}`;
        },
        customSuccessObject: env.NODE_ENV === "development" ? noop : undefined,
        customErrorObject: env.NODE_ENV === "development" ? noop : undefined,
      }),
    );
    this.app.use(healthRouter);
  }
  static inject = ["loggerManager", "ingester"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(`Ingester server listening on port ${env.PORT}`);
      this.ingester.start();
    });
  }
}
