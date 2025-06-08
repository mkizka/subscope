import { LRUCache } from "lru-cache";

import type { IBlobCacheRepository } from "../application/interfaces/blob-cache-repository.js";
import type { BlobData } from "../shared/types.js";

export class BlobCacheRepository implements IBlobCacheRepository {
  private cache: LRUCache<string, BlobData>;

  constructor() {
    this.cache = new LRUCache({
      max: 1000,
      ttl: 24 * 60 * 60 * 1000,
    });
  }

  get(key: string): Promise<BlobData | undefined> {
    return Promise.resolve(this.cache.get(key));
  }

  set(key: string, value: BlobData): Promise<void> {
    this.cache.set(key, value);
    return Promise.resolve();
  }
}
