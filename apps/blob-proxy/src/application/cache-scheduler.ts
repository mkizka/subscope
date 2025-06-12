import type { ILoggerManager, Logger } from "@repo/common/domain";
import * as cron from "node-cron";

import { env } from "../shared/env.js";
import type { CacheCleanupService } from "./cache-cleanup-service.js";

export class CacheScheduler {
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly cacheCleanupService: CacheCleanupService,
  ) {
    this.logger = loggerManager.createLogger("CacheScheduler");
  }

  static inject = ["loggerManager", "cacheCleanupService"] as const;

  start(): void {
    cron.schedule(
      env.CACHE_CLEANUP_CRON,
      async () => {
        try {
          this.logger.info("Starting cache cleanup");
          const deletedCount = await this.cacheCleanupService.cleanup(
            env.CACHE_RETENTION_TIME,
          );
          this.logger.info(
            `Cache cleanup completed. Deleted ${deletedCount} entries`,
          );
        } catch (error) {
          this.logger.error(error, "Cache cleanup failed");
        }
      },
      { timezone: env.CACHE_CLEANUP_TIMEZONE },
    );
    this.logger.info(
      `Cache scheduler started with cron expression '${env.CACHE_CLEANUP_CRON}' (${env.CACHE_CLEANUP_TIMEZONE}), retaining files for ${env.CACHE_RETENTION_TIME}ms`,
    );
  }
}
