import type { Did } from "@atproto/did";
import type { ILoggerManager, Logger } from "@dawn/common/domain";

import type { BlobData } from "../domain/blob-data.js";
import { ImagePreset } from "../domain/image-preset.js";
import type { ImageTransformRequest } from "../domain/image-transform-request.js";
import type { ImageTransformationService } from "../domain/services/image-transformation-service.js";
import type { IBlobCacheRepository } from "./interfaces/blob-cache-repository.js";
import type { IBlobFetcher } from "./interfaces/blob-fetcher.js";
import type { ResolvePdsService } from "./resolve-pds-service.js";

export class ImageTransformService {
  private logger: Logger;

  constructor(
    private resolvePdsService: ResolvePdsService,
    private blobFetcher: IBlobFetcher,
    private imageTransformationService: ImageTransformationService,
    private blobCacheRepository: IBlobCacheRepository,
    loggerManager: ILoggerManager,
  ) {
    this.logger = loggerManager.createLogger("image-transform-service");
  }
  static inject = [
    "resolvePdsService",
    "blobFetcher",
    "imageTransformationService",
    "blobCacheRepository",
    "loggerManager",
  ] as const;

  async getTransformedImage(request: ImageTransformRequest): Promise<BlobData> {
    const cacheKey = request.getCacheKey();
    const cached = await this.blobCacheRepository.get(cacheKey);
    if (cached) {
      this.logger.debug(
        { did: request.did, cid: request.cid, type: request.presetType },
        "Cache hit for transformed image",
      );
      return cached;
    }

    this.logger.debug(
      { did: request.did, cid: request.cid, type: request.presetType },
      "Cache miss, transforming image",
    );

    const preset = ImagePreset.fromType(request.presetType);
    const originalBlob = await this.fetchOriginalBlob(request.did, request.cid);
    const transformedBlob = await this.imageTransformationService.transform(
      originalBlob,
      preset,
    );

    await this.blobCacheRepository.set(cacheKey, transformedBlob);
    this.logger.debug(
      { did: request.did, cid: request.cid, type: request.presetType },
      "Image transformed and cached",
    );

    return transformedBlob;
  }

  private async fetchOriginalBlob(did: Did, cid: string): Promise<BlobData> {
    const pdsUrl = await this.resolvePdsService.resolve(did);
    return await this.blobFetcher.fetchBlob(pdsUrl, did, cid);
  }
}
