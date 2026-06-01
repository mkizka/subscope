import path from "path";

import type { ImageBlob } from "./image-blob.js";

const SUCCESS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1週間
const FAILED_CACHE_TTL_MS = 5 * 60 * 1000; // 5分

export class CacheMetadata {
  readonly cacheKey: string;
  readonly status: "success" | "failed";
  readonly imageBlob: ImageBlob | null;
  readonly expiredAt: Date;

  constructor(params: {
    cacheKey: string;
    status: "success" | "failed";
    imageBlob: ImageBlob | null;
    expiredAt: Date;
  }) {
    this.cacheKey = params.cacheKey;
    this.status = params.status;
    this.imageBlob = params.imageBlob;
    this.expiredAt = params.expiredAt;
  }

  getPath(blobCacheDir: string): string {
    return path.join(blobCacheDir, `${this.cacheKey}.jpg`);
  }

  static create(params: {
    cacheKey: string;
    imageBlob: ImageBlob | null;
  }): CacheMetadata {
    const status = params.imageBlob ? "success" : "failed";
    const now = new Date();
    const ttlMs =
      status === "success" ? SUCCESS_CACHE_TTL_MS : FAILED_CACHE_TTL_MS;
    const expiredAt = new Date(now.getTime() + ttlMs);

    return new CacheMetadata({
      cacheKey: params.cacheKey,
      status,
      imageBlob: params.imageBlob,
      expiredAt,
    });
  }
}
