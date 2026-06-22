import type { Server } from "node:http";

import type { ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import express, { type Router } from "express";
import promBundle from "express-prom-bundle";

import type { SyncWorker } from "./worker.js";

export class WorkerServer {
  private readonly app: express.Express;
  private readonly logger: Logger;
  private server?: Server;

  constructor(
    loggerManager: ILoggerManager,
    private readonly syncWorker: SyncWorker,
    healthRouter: Router,
    private readonly port: number,
  ) {
    this.logger = loggerManager.createLogger("WorkerServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(promBundle({ includeMethod: true }));
    this.app.use(healthRouter);
  }
  static inject = [
    "loggerManager",
    "syncWorker",
    "healthRouter",
    "port",
  ] as const;

  start() {
    this.server = this.app.listen(this.port, async () => {
      this.logger.info(`Worker server listening on port ${this.port}`);
      await this.syncWorker.start();
    });

    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  private async shutdown() {
    this.logger.info("Shutting down worker server...");
    await Promise.all([this.stopWorkers(), this.stopServer()]);
    this.logger.info("Worker server shutdown complete");
    process.exit(0);
  }

  private async stopWorkers() {
    try {
      await this.syncWorker.stop();
      this.logger.info("Workers stopped successfully");
    } catch (error) {
      this.logger.error({ error }, "Error stopping workers");
    }
  }

  private async stopServer() {
    await new Promise<void>((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info("HTTP server closed");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
