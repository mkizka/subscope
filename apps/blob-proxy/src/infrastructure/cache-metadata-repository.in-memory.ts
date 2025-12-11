import type { ICacheMetadataRepository } from "../application/interfaces/cache-metadata-repository.js";
import type { CacheMetadata } from "../domain/cache-metadata.js";

export class InMemoryCacheMetadataRepository implements ICacheMetadataRepository {
  private cache: Map<string, CacheMetadata> = new Map();

  clear(): void {
    this.cache.clear();
  }

  get(key: string): Promise<CacheMetadata | null> {
    return Promise.resolve(this.cache.get(key) ?? null);
  }

  save(cacheMetadata: CacheMetadata): Promise<void> {
    this.cache.set(cacheMetadata.cacheKey, cacheMetadata);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.cache.delete(key);
    return Promise.resolve();
  }

  findExpired(): Promise<CacheMetadata[]> {
    const now = new Date();
    return Promise.resolve(
      Array.from(this.cache.values()).filter(
        (metadata) => metadata.expiredAt < now,
      ),
    );
  }
}
