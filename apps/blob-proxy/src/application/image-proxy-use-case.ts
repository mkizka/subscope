import { DidResolutionError, type IMetricReporter } from "@repo/common/domain";

import { CacheMetadata } from "../domain/cache-metadata.js";
import type { ImageBlob } from "../domain/image-blob.js";
import type { ImageProxyRequest } from "../domain/image-proxy-request.js";
import { BlobFetchFailedError } from "./interfaces/blob-fetcher.js";
import type { IImageResizer } from "./interfaces/image-resizer.js";
import type { FetchBlobService } from "./services/fetch-blob-service.js";
import type { ImageCacheService } from "./services/image-cache-service.js";

export class ImageProxyUseCase {
  constructor(
    private fetchBlobService: FetchBlobService,
    private imageResizer: IImageResizer,
    private imageCacheService: ImageCacheService,
    private metricReporter: IMetricReporter,
  ) {}
  static inject = [
    "fetchBlobService",
    "imageResizer",
    "imageCacheService",
    "metricReporter",
  ] as const;

  async execute(request: ImageProxyRequest): Promise<ImageBlob | null> {
    const cacheKey = request.getCacheKey();
    const cached = await this.imageCacheService.get(cacheKey);
    if (cached) {
      this.metricReporter.increment("blob_proxy_cache_hit_total");
      if (cached.status === "success") {
        return cached.imageBlob;
      } else {
        return null;
      }
    }
    this.metricReporter.increment("blob_proxy_cache_miss_total");

    try {
      const originalBlob = await this.fetchBlobService.fetchBlob({
        did: request.did,
        cid: request.cid,
      });
      const resizedBlob = await this.imageResizer.resize({
        blob: originalBlob,
        preset: request.preset,
      });

      const successCacheMetadata = CacheMetadata.create({
        cacheKey,
        imageBlob: resizedBlob,
      });
      await this.imageCacheService.set(successCacheMetadata);
      return resizedBlob;
    } catch (e) {
      if (
        e instanceof BlobFetchFailedError ||
        e instanceof DidResolutionError
      ) {
        this.metricReporter.increment("blob_proxy_error_total", {
          error: e.name,
        });
        const failedCacheMetadata = CacheMetadata.create({
          cacheKey,
          imageBlob: null,
        });
        await this.imageCacheService.set(failedCacheMetadata);
        return null;
      }
      throw e;
    }
  }
}
