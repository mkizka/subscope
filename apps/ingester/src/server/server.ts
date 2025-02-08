import type {
  ILoggerManager,
  IMetricReporter,
  Logger,
} from "@dawn/common/domain";
import type { Router } from "express";
import express from "express";
import { pinoHttp } from "pino-http";

import { env } from "../shared/env.js";
import type { JetstreamIngester } from "./jetstream.js";
import { healthRouter } from "./routes/health.js";

const noop = () => {};

export class IngesterServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    metricsRouter: Router,
    dashboardRouter: Router,
    private readonly ingester: JetstreamIngester,
    private readonly metricReporter: IMetricReporter,
  ) {
    this.logger = loggerManager.createLogger("IngesterServer");
    this.app = express();
    this.app.use(
      pinoHttp({
        logger: this.logger,
        autoLogging: {
          ignore: (req) => req.path === "/metrics",
        },
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
    this.app.use(metricsRouter);
    this.app.use(dashboardRouter);
  }
  static inject = [
    "loggerManager",
    "dashboardRouter",
    "metricsRouter",
    "ingester",
    "metricReporter",
  ] as const;

  start() {
    this.metricReporter.resetAll();
    this.app.listen(env.PORT, () => {
      this.logger.info(`Ingester server listening on port ${env.PORT}`);
      this.ingester.start();
    });
  }
}
