import express from "express";
import { pinoHttp } from "pino-http";

import { env } from "../shared/env.js";
import { createLogger } from "../shared/logger.js";

const logger = createLogger("Server");

export interface IIngester {
  start(): void;
}

export class Server {
  constructor(private readonly ingester: IIngester) {}
  static inject = ["ingester"] as const;

  start() {
    const app = express();
    app.use(pinoHttp());
    app.listen(env.PORT, () => {
      logger.info(`Appview server listening on port ${env.PORT}`);
      this.ingester.start();
    });
  }
}
