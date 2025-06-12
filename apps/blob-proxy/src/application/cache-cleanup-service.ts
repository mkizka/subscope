import type { ILoggerManager, Logger } from "@repo/common/domain";

import type { ICacheMetadataRepository } from "./interfaces/cache-metadata-repository.js";
import type { IImageCacheStorage } from "./interfaces/image-cache-storage.js";

export class CacheCleanupService {
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly cacheMetadataRepository: ICacheMetadataRepository,
    private readonly imageStorage: IImageCacheStorage,
  ) {
    this.logger = loggerManager.createLogger("CacheCleanupService");
  }

  static inject = [
    "loggerManager",
    "cacheMetadataRepository",
    "imageCacheStorage",
  ] as const;

  async cleanup(retentionTimeMs: number): Promise<number> {
    const expirationDate = new Date(Date.now() - retentionTimeMs);

    const expiredEntries =
      await this.cacheMetadataRepository.findExpiredEntries(expirationDate);

    let deletedCount = 0;
    for (const entry of expiredEntries) {
      try {
        await this.imageStorage.remove(entry.cacheKey);
        await this.cacheMetadataRepository.delete(entry.cacheKey);
        deletedCount++;
      } catch (error) {
        this.logger.error(
          error,
          `Failed to delete cache entry: ${entry.cacheKey}`,
        );
      }
    }
    return deletedCount;
  }
}
