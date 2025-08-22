import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import cors from "cors";
import express from "express";
import promBundle from "express-prom-bundle";

import { env } from "../shared/env.js";
import { healthRouter } from "./routes/health.js";
import { wellKnownRouter } from "./routes/well-known.js";
import type { XRPCRouter } from "./routes/xrpc.js";

const MONITORING_PATHS = ["/xrpc", "/health", "/.well-known"];

export class AppviewServer {
  private readonly app: express.Express;
  private readonly logger: Logger;

  constructor(
    private readonly xrpcRouter: XRPCRouter,
    loggerManager: ILoggerManager,
  ) {
    this.logger = loggerManager.createLogger("AppviewServer");
    this.app = express();
    this.app.use(cors());
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(
      promBundle({
        includeMethod: true,
        includePath: true,
        normalizePath: (req) => {
          if (MONITORING_PATHS.some((path) => req.path.startsWith(path))) {
            return req.path;
          }
          return "/others";
        },
      }),
    );
    this.app.use(this.xrpcRouter.create());
    this.app.use(healthRouter);
    this.app.use(wellKnownRouter);
  }
  static inject = ["xrpcRouter", "loggerManager"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      this.logger.info(`Appview server listening on port ${env.PORT}`);
    });
  }
}
