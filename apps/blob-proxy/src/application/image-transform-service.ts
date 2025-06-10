import type { IMetricReporter } from "@repo/common/domain";

import type { ImageBlob } from "../domain/image-blob.js";
import type { ImageTransformRequest } from "../domain/image-transform-request.js";
import type { ImageBlobService } from "../domain/services/image-blob-service.js";
import type { FetchBlobService } from "./fetch-blob-service.js";
import type { IBlobCacheRepository } from "./interfaces/blob-cache-repository.js";

export class ImageTransformService {
  constructor(
    private fetchBlobService: FetchBlobService,
    private imageBlobService: ImageBlobService,
    private blobCacheRepository: IBlobCacheRepository,
    private metricReporter: IMetricReporter,
  ) {}
  static inject = [
    "fetchBlobService",
    "imageBlobService",
    "blobCacheRepository",
    "metricReporter",
  ] as const;

  async getTransformedImage(
    request: ImageTransformRequest,
  ): Promise<ImageBlob> {
    const cacheKey = request.getCacheKey();
    const cached = await this.blobCacheRepository.get(cacheKey);
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

    await this.blobCacheRepository.set(cacheKey, transformedBlob);
    return transformedBlob;
  }
}
