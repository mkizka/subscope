import client from "@dawn/client";
import express from "express";
import { pinoHttp } from "pino-http";

import type { IIngester } from "../domain/repositories/ingester.js";
import { env } from "../shared/env.js";
import { createLogger } from "../shared/logger.js";
import type { XRPCRoutes } from "./xrpc/route.js";

const logger = createLogger("Server");

export class AppviewServer {
  constructor(
    private ingester: IIngester,
    private xrpcRoutes: XRPCRoutes,
  ) {}
  static inject = ["ingester", "xrpcRoutes"] as const;

  start() {
    const app = express();
    app.use(pinoHttp());

    const server = client.createServer();
    this.xrpcRoutes.register(server);
    app.use(server.xrpc.routes);

    app.listen(env.PORT, () => {
      logger.info(`Appview server listening on port ${env.PORT}`);
      this.ingester.start();
    });
  }
}
