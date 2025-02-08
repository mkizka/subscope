import type {
  ILoggerManager,
  IMetricReporter,
  Logger,
} from "@dawn/common/domain";
import express from "express";
import promBundle from "express-prom-bundle";
import { pinoHttp } from "pino-http";

import { env } from "../shared/env.js";
import { healthRouter } from "./routes/health.js";
import type { SyncWorker } from "./worker.js";

const noop = () => {};

export class WorkerServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly syncWorker: SyncWorker,
    private readonly metricReporter: IMetricReporter,
  ) {
    this.logger = loggerManager.createLogger("WorkerServer");
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
  static inject = ["loggerManager", "syncWorker", "metricReporter"] as const;

  start() {
    this.app.listen(env.PORT, async () => {
      this.logger.info(`Worker server listening on port ${env.PORT}`);
      await this.syncWorker.start();
    });
  }
}
