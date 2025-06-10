import type { IMetricReporter } from "@repo/common/domain";

import type { ImageBlob } from "../domain/image-blob.js";
import { ImagePreset } from "../domain/image-preset.js";
import type { ImageTransformRequest } from "../domain/image-transform-request.js";
import type { ImageTransformationService } from "../domain/services/image-transformation-service.js";
import type { FetchBlobService } from "./fetch-blob-service.js";
import type { IBlobCacheRepository } from "./interfaces/blob-cache-repository.js";

export class ImageTransformService {
  constructor(
    private fetchBlobService: FetchBlobService,
    private imageTransformationService: ImageTransformationService,
    private blobCacheRepository: IBlobCacheRepository,
    private metricReporter: IMetricReporter,
  ) {}
  static inject = [
    "fetchBlobService",
    "imageTransformationService",
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

    const preset = ImagePreset.fromType(request.presetType);
    const originalBlob = await this.fetchBlobService.fetchBlob(
      request.did,
      request.cid,
    );
    const transformedBlob = await this.imageTransformationService.transform(
      originalBlob,
      preset,
    );

    await this.blobCacheRepository.set(cacheKey, transformedBlob);
    return transformedBlob;
  }
}
