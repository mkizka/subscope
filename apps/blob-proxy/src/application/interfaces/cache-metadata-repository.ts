import type { CacheMetadata } from "../../domain/cache-metadata.js";

export interface ICacheMetadataRepository {
  get: (key: string) => Promise<CacheMetadata | null>;
  save: (cacheMetadata: CacheMetadata) => Promise<void>;
  delete: (key: string) => Promise<void>;
  findExpired: () => Promise<CacheMetadata[]>;
}
