import type { Server } from "node:http";

import type { IJobQueue, ILoggerManager, Logger } from "@repo/common/interface";
import { loggingMiddleware } from "@repo/common/utils";
import express, { type Router } from "express";
import promBundle from "express-prom-bundle";

import type { ScheduleBackfillChecksUseCase } from "../application/use-cases/async/schedule-backfill-checks-use-case.js";
import type { Env } from "../shared/env.js";
import type { LabelSubscriber } from "./label-subscriber.js";
import type { TapSubscriber } from "./tap.js";
import type { SyncWorker } from "./worker.js";

export class WorkerServer {
  private readonly app: express.Express;
  private readonly logger: Logger;
  private server?: Server;

  constructor(
    private readonly deps: {
      loggerManager: ILoggerManager;
      syncWorker: SyncWorker;
      tapSubscriber: TapSubscriber;
      labelSubscriber: LabelSubscriber;
      jobQueue: IJobQueue;
      scheduleBackfillChecksUseCase: ScheduleBackfillChecksUseCase;
      healthRouter: Router;
      env: Pick<Env, "NODE_ENV" | "PORT">;
    },
  ) {
    this.logger = deps.loggerManager.createLogger("WorkerServer");
    this.app = express();
    this.app.use(
      loggingMiddleware(this.logger, deps.env.NODE_ENV === "development"),
    );
    this.app.use(promBundle({ includeMethod: true }));
    this.app.use(deps.healthRouter);
  }

  start() {
    this.server = this.app.listen(this.deps.env.PORT, async () => {
      this.logger.info(`Worker server listening on port ${this.deps.env.PORT}`);
      this.deps.tapSubscriber.start().catch((err: unknown) => {
        this.logger.error({ err }, "Tap subscriber threw");
      });
      this.deps.labelSubscriber.start().catch((err: unknown) => {
        this.logger.error({ err }, "Label subscriber threw");
      });
      this.deps.scheduleBackfillChecksUseCase
        .execute()
        .catch((err: unknown) => {
          this.logger.error({ err }, "Failed to schedule backfill checks");
        });
      await this.deps.syncWorker.start();
    });
    setInterval(() => void this.logQueueCounts(), 60 * 1000).unref();

    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  private async logQueueCounts() {
    try {
      const entries = await Promise.all(
        this.deps.jobQueue
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
      await this.deps.syncWorker.stop();
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
