import path from "path";

import { env } from "../shared/env.js";

export class CacheMetadata {
  readonly cacheKey: string;
  readonly createdAt: Date;

  constructor(params: { cacheKey: string; createdAt: Date }) {
    this.cacheKey = params.cacheKey;
    this.createdAt = params.createdAt;
  }

  getPath(): string {
    return path.join(env.BLOB_CACHE_DIR, `${this.cacheKey}.jpg`);
  }
}
