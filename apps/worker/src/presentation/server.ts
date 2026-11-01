import type { Server } from "node:http";

import type { IJobQueue, ILoggerManager, Logger } from "@repo/common/domain";
import { loggingMiddleware } from "@repo/common/utils";
import express, { type Router } from "express";
import promBundle from "express-prom-bundle";

import type { ScheduleBackfillChecksUseCase } from "../application/use-cases/async/schedule-backfill-checks-use-case.js";
import type { LabelSubscriber } from "./label-subscriber.js";
import type { TapSubscriber } from "./tap.js";
import type { SyncWorker } from "./worker.js";

export class WorkerServer {
  private readonly app: express.Express;
  private readonly logger: Logger;
  private server?: Server;

  constructor(
    loggerManager: ILoggerManager,
    private readonly syncWorker: SyncWorker,
    private readonly tapSubscriber: TapSubscriber,
    private readonly labelSubscriber: LabelSubscriber,
    private readonly jobQueue: IJobQueue,
    private readonly scheduleBackfillChecksUseCase: ScheduleBackfillChecksUseCase,
    healthRouter: Router,
    private readonly port: number,
  ) {
    this.logger = loggerManager.createLogger("WorkerServer");
    this.app = express();
    this.app.use(loggingMiddleware(this.logger));
    this.app.use(promBundle({ includeMethod: true }));
    this.app.use(healthRouter);
  }

  start() {
    this.server = this.app.listen(this.port, async () => {
      this.logger.info(`Worker server listening on port ${this.port}`);
      this.tapSubscriber.start().catch((err: unknown) => {
        this.logger.error({ err }, "Tap subscriber threw");
      });
      this.labelSubscriber.start().catch((err: unknown) => {
        this.logger.error({ err }, "Label subscriber threw");
      });
      this.scheduleBackfillChecksUseCase.execute().catch((err: unknown) => {
        this.logger.error({ err }, "Failed to schedule backfill checks");
      });
      await this.syncWorker.start();
    });
    setInterval(() => void this.logQueueCounts(), 60 * 1000).unref();

    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  private async logQueueCounts() {
    try {
      const entries = await Promise.all(
        this.jobQueue
          .getQueues()
          .map(async (queue) => [
            queue.name,
            await queue.getJobCounts(
              "waiting",
              "prioritized",
              "active",
              "delayed",
              "failed",
            ),
          ]),
      );
      this.logger.info({ queues: Object.fromEntries(entries) }, "Queue counts");
    } catch (error) {
      this.logger.error({ error }, "Failed to get queue counts");
    }
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
