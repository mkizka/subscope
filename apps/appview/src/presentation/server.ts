import express from "express";
import { pinoHttp } from "pino-http";

import type { IIngester } from "../domain/interfaces/ingester.js";
import { env } from "../shared/env.js";
import { createLogger } from "../shared/logger.js";
import { wellKnownRouter } from "./routes/well-known.js";
import type { XRPCRoutes } from "./routes/xrpc.js";

const logger = createLogger("Server");

export class AppviewServer {
  private readonly app: express.Express;

  constructor(
    private readonly ingester: IIngester,
    private readonly xrpcRoutes: XRPCRoutes,
  ) {
    this.app = express();
    this.app.use(pinoHttp());
    this.app.use(this.xrpcRoutes.create());
    this.app.use(wellKnownRouter);
  }
  static inject = ["ingester", "xrpcRoutes"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      logger.info(`Appview server listening on port ${env.PORT}`);
      this.ingester.start();
    });
  }
}
