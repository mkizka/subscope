import type { Did } from "@atproto/did";
import type { IMetricReporter } from "@repo/common/domain";

import type { ImageBlob } from "../domain/blob-data.js";
import { ImagePreset } from "../domain/image-preset.js";
import type { ImageTransformRequest } from "../domain/image-transform-request.js";
import type { ImageTransformationService } from "../domain/services/image-transformation-service.js";
import type { IBlobCacheRepository } from "./interfaces/blob-cache-repository.js";
import type { IBlobFetcher } from "./interfaces/blob-fetcher.js";
import type { ResolvePdsService } from "./resolve-pds-service.js";

export class ImageTransformService {
  constructor(
    private resolvePdsService: ResolvePdsService,
    private blobFetcher: IBlobFetcher,
    private imageTransformationService: ImageTransformationService,
    private blobCacheRepository: IBlobCacheRepository,
    private metricReporter: IMetricReporter,
  ) {}
  static inject = [
    "resolvePdsService",
    "blobFetcher",
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
    const originalBlob = await this.fetchOriginalBlob(request.did, request.cid);
    const transformedBlob = await this.imageTransformationService.transform(
      originalBlob,
      preset,
    );

    await this.blobCacheRepository.set(cacheKey, transformedBlob);
    return transformedBlob;
  }

  private async fetchOriginalBlob(did: Did, cid: string): Promise<ImageBlob> {
    const pdsUrl = await this.resolvePdsService.resolve(did);
    return await this.blobFetcher.fetchBlob(pdsUrl, did, cid);
  }
}
