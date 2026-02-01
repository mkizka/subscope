import type { ICacheMetadataRepository } from "@/server/features/blob-proxy/application/interfaces/cache-metadata-repository.js";

import type { ImageCacheService } from "./image-cache-service.js";

export class CacheCleanupService {
  constructor(
    private readonly cacheMetadataRepository: ICacheMetadataRepository,
    private readonly imageCacheService: ImageCacheService,
  ) {}

  static inject = ["cacheMetadataRepository", "imageCacheService"] as const;

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
