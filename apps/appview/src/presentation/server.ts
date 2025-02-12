import type { ILoggerManager, Logger } from "@dawn/common/domain";
import express from "express";
import promBundle from "express-prom-bundle";
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
    this.app.use(this.xrpcRoutes.create());
    this.app.use(healthRouter);
    this.app.use(wellKnownRouter);
    // @ts-expect-error
    this.app.use((err, req, res, next) => {
      // eslint-disable-next-line no-console
      console.log("err catched", err);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      res.status(500).send("Internal server error!!!");
    });
  }
  static inject = ["xrpcRoutes", "loggerManager"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(`Appview server listening on port ${env.PORT}`);
    });
  }
}
