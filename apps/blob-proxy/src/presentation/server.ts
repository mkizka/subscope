import type { ILoggerManager, Logger } from "@dawn/common/domain";
import express from "express";
import { pinoHttp } from "pino-http";

import { env } from "../shared/env.js";
import { healthRouter } from "./routes/health.js";

const noop = () => {};

export class BlobProxyServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(loggerManager: ILoggerManager, blobRouter: express.Router) {
    this.logger = loggerManager.createLogger("BlobProxyServer");
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
    this.app.use("/health", healthRouter);
    this.app.use("/blob", blobRouter);
  }
  static inject = ["loggerManager", "blobRouter"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(`Blob proxy server listening on port ${env.PORT}`);
    });
  }
}
