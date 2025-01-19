import type { ILoggerManager, Logger } from "@dawn/common/domain";
import express from "express";
import { pinoHttp } from "pino-http";

import { env } from "../shared/env.js";
import { healthRouter } from "./routes/health.js";
import { wellKnownRouter } from "./routes/well-known.js";
import type { XRPCRoutes } from "./routes/xrpc.js";

const noop = () => {};

export class AppviewServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    private readonly xrpcRoutes: XRPCRoutes,
    loggerManager: ILoggerManager,
  ) {
    this.logger = loggerManager.createLogger("AppviewServer");
    this.app = express();
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
    this.app.use(this.xrpcRoutes.create());
    this.app.use(healthRouter);
    this.app.use(wellKnownRouter);
  }
  static inject = ["xrpcRoutes", "loggerManager"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(`Appview server listening on port ${env.PORT}`);
    });
  }
}
