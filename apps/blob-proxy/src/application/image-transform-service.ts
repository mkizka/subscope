import type { IMetricReporter } from "@repo/common/domain";

import type { ImageBlob } from "../domain/image-blob.js";
import type { ImageTransformRequest } from "../domain/image-transform-request.js";
import type { ImageBlobService } from "../domain/services/image-blob-service.js";
import type { FetchBlobService } from "./fetch-blob-service.js";
import type { ImageCacheService } from "./image-cache-service.js";

export class ImageTransformService {
  constructor(
    private fetchBlobService: FetchBlobService,
    private imageBlobService: ImageBlobService,
    private imageCacheService: ImageCacheService,
    private metricReporter: IMetricReporter,
  ) {}
  static inject = [
    "fetchBlobService",
    "imageBlobService",
    "imageCacheService",
    "metricReporter",
  ] as const;

  async getTransformedImage(
    request: ImageTransformRequest,
  ): Promise<ImageBlob> {
    const cached = await this.imageCacheService.get(request);
    if (cached) {
      this.metricReporter.increment("blob_proxy_cache_hit_total");
      return cached;
    }
    this.metricReporter.increment("blob_proxy_cache_miss_total");

    const originalBlob = await this.fetchBlobService.fetchBlob({
      did: request.did,
      cid: request.cid,
    });
    const transformedBlob = await this.imageBlobService.transform({
      blob: originalBlob,
      preset: request.preset,
    });

    await this.imageCacheService.set(request, transformedBlob);
    return transformedBlob;
  }
}
