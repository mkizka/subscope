import { LRUCache } from "lru-cache";

import type { IBlobCacheRepository } from "../application/interfaces/blob-cache-repository.js";
import type { ImageBlob } from "../domain/image-blob.js";

export class BlobCacheRepository implements IBlobCacheRepository {
  private cache: LRUCache<string, ImageBlob>;

  constructor() {
    this.cache = new LRUCache({
      max: 1000,
      ttl: 24 * 60 * 60 * 1000,
    });
  }

  get(key: string): Promise<ImageBlob | undefined> {
    return Promise.resolve(this.cache.get(key));
  }

  set(key: string, value: ImageBlob): Promise<void> {
    this.cache.set(key, value);
    return Promise.resolve();
  }
}
