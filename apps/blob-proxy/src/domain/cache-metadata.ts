import path from "path";

import { env } from "../shared/env.js";
import type { ImageBlob } from "./image-blob.js";

export class CacheMetadata {
  readonly cacheKey: string;
  readonly status: "success" | "failed";
  readonly imageBlob: ImageBlob | null;

  constructor(params: {
    cacheKey: string;
    status: "success" | "failed";
    imageBlob: ImageBlob | null;
  }) {
    this.cacheKey = params.cacheKey;
    this.status = params.status;
    this.imageBlob = params.imageBlob;
  }

  getPath(): string {
    return path.join(env.BLOB_CACHE_DIR, `${this.cacheKey}.jpg`);
  }
}
