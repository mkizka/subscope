import type { ILoggerManager, Logger } from "@repo/common/domain";

import type { ICacheMetadataRepository } from "../interfaces/cache-metadata-repository.js";
import type { ImageCacheService } from "./image-cache-service.js";

export class CacheCleanupService {
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly cacheMetadataRepository: ICacheMetadataRepository,
    private readonly imageCacheService: ImageCacheService,
  ) {
    this.logger = loggerManager.createLogger("CacheCleanupService");
  }

  static inject = [
    "loggerManager",
    "cacheMetadataRepository",
    "imageCacheService",
  ] as const;

  async cleanup(): Promise<number> {
    const expiredEntries = await this.cacheMetadataRepository.findExpired();

    let deletedCount = 0;
    for (const entry of expiredEntries) {
      await this.imageCacheService.delete(entry);
      deletedCount++;
    }
    return deletedCount;
  }
}
