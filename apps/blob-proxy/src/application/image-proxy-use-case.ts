import type { IMetricReporter } from "@repo/common/domain";

import type { ImageBlob } from "../domain/image-blob.js";
import type { ImageProxyRequest } from "../domain/image-proxy-request.js";
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

  async execute(request: ImageProxyRequest): Promise<ImageBlob> {
    const cacheKey = request.getCacheKey();
    const cached = await this.imageCacheService.get(cacheKey);
    if (cached) {
      this.metricReporter.increment("blob_proxy_cache_hit_total");
      return cached;
    }
    this.metricReporter.increment("blob_proxy_cache_miss_total");

    const originalBlob = await this.fetchBlobService.fetchBlob({
      did: request.did,
      cid: request.cid,
    });
    const resizedBlob = await this.imageResizer.resize({
      blob: originalBlob,
      preset: request.preset,
    });

    await this.imageCacheService.set(cacheKey, resizedBlob);
    return resizedBlob;
  }
}
