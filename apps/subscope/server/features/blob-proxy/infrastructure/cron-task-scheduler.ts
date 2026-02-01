import type { ILoggerManager, Logger } from "@repo/common/domain";
import * as cron from "node-cron";

import type {
  ITaskScheduler,
  ScheduleOptions,
} from "@/server/features/blob-proxy/application/interfaces/task-scheduler.js";

export class CronTaskScheduler implements ITaskScheduler {
  private readonly logger: Logger;

  constructor(loggerManager: ILoggerManager) {
    this.logger = loggerManager.createLogger("CronTaskScheduler");
  }

  static inject = ["loggerManager"] as const;

  start(
    cronExpression: string,
    task: () => Promise<void>,
    options?: ScheduleOptions,
  ): void {
    cron.schedule(cronExpression, task, {
      timezone: options?.timezone,
    });

    this.logger.info(
      options,
      `Started scheduled task with cron expression '${cronExpression}`,
    );
  }
}
