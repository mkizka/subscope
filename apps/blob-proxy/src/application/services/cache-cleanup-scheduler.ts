import type { ILoggerManager, Logger } from "@repo/common/domain";

import { env } from "../../shared/env.js";
import type { ITaskScheduler } from "../interfaces/task-scheduler.js";
import type { CacheCleanupService } from "./cache-cleanup-service.js";

export class CacheCleanupScheduler {
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly taskScheduler: ITaskScheduler,
    private readonly cacheCleanupService: CacheCleanupService,
  ) {
    this.logger = loggerManager.createLogger("CacheCleanupScheduler");
  }

  static inject = [
    "loggerManager",
    "taskScheduler",
    "cacheCleanupService",
  ] as const;

  start(): void {
    this.taskScheduler.start(
      env.CACHE_CLEANUP_CRON,
      () => this.performCleanup(),
      { timezone: env.CACHE_CLEANUP_TIMEZONE },
    );

    this.logger.info(
      `Cache scheduling started with cron expression '${env.CACHE_CLEANUP_CRON}' (${env.CACHE_CLEANUP_TIMEZONE}), TTL: success=1week, failed=5minutes`,
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
