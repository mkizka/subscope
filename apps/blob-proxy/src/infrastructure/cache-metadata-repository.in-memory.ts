import type { ICacheMetadataRepository } from "../application/interfaces/cache-metadata-repository.js";
import type { CacheMetadata } from "../domain/cache-metadata.js";

export class InMemoryCacheMetadataRepository implements ICacheMetadataRepository {
  private cache: Map<string, CacheMetadata> = new Map();

  clear(): void {
    this.cache.clear();
  }

  async get(key: string): Promise<CacheMetadata | null> {
    return this.cache.get(key) ?? null;
  }

  async save(cacheMetadata: CacheMetadata): Promise<void> {
    this.cache.set(cacheMetadata.cacheKey, cacheMetadata);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async findExpired(): Promise<CacheMetadata[]> {
    const now = new Date();
    return Array.from(this.cache.values()).filter(
      (metadata) => metadata.expiredAt < now,
    );
  }
}
