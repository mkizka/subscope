import type { ILoggerManager, Logger } from "@repo/common/domain";

import type { ITaskScheduler } from "../interfaces/task-scheduler.js";
import type { CacheCleanupService } from "./cache-cleanup-service.js";

export class CacheCleanupScheduler {
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly taskScheduler: ITaskScheduler,
    private readonly cacheCleanupService: CacheCleanupService,
    private readonly cacheCleanupCron: string,
    private readonly cacheCleanupTimezone: string,
  ) {
    this.logger = loggerManager.createLogger("CacheCleanupScheduler");
  }

  static inject = [
    "loggerManager",
    "taskScheduler",
    "cacheCleanupService",
    "cacheCleanupCron",
    "cacheCleanupTimezone",
  ] as const;

  start(): void {
    this.taskScheduler.start(
      this.cacheCleanupCron,
      () => this.performCleanup(),
      { timezone: this.cacheCleanupTimezone },
    );

    this.logger.info(
      `Cache scheduling started with cron expression '${this.cacheCleanupCron}' (${this.cacheCleanupTimezone}), TTL: success=1week, failed=5minutes`,
    );
  }

  private async performCleanup(): Promise<void> {
    const deletedCount = await this.cacheCleanupService.cleanup();
    if (deletedCount > 0) {
      this.logger.info(
        `Cache cleanup completed. Deleted ${deletedCount} entries`,
      );
    }
  }
}
