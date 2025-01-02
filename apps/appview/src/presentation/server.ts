import express from "express";
import { pinoHttp } from "pino-http";

import { env } from "../shared/env.js";
import { createLogger } from "../shared/logger.js";
import { wellKnownRouter } from "./routes/well-known.js";
import type { XRPCRoutes } from "./routes/xrpc.js";

const logger = createLogger("Server");

const noop = () => {};

export class AppviewServer {
  private readonly app: express.Express;

  constructor(private readonly xrpcRoutes: XRPCRoutes) {
    this.app = express();
    this.app.use(
      pinoHttp({
        logger,
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
    this.app.use(wellKnownRouter);
  }
  static inject = ["xrpcRoutes"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      logger.info(`Appview server listening on port ${env.PORT}`);
    });
  }
}
