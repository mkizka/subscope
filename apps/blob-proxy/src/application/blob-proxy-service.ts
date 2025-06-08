import type { Did } from "@atproto/did";
import type { ILoggerManager, Logger } from "@dawn/common/domain";

import type { BlobData } from "../shared/types.js";
import type { IBlobCacheRepository } from "./interfaces/blob-cache-repository.js";
import type { IBlobFetcher } from "./interfaces/blob-fetcher.js";
import type { ResolvePdsService } from "./resolve-pds-service.js";

export class BlobProxyService {
  private logger: Logger;

  constructor(
    private resolvePdsService: ResolvePdsService,
    private blobFetcher: IBlobFetcher,
    private blobCacheRepository: IBlobCacheRepository,
    loggerManager: ILoggerManager,
  ) {
    this.logger = loggerManager.createLogger("blob-proxy-service");
  }
  static inject = [
    "resolvePdsService",
    "blobFetcher",
    "blobCacheRepository",
    "loggerManager",
  ] as const;

  async getBlob({ did, cid }: { did: Did; cid: string }): Promise<BlobData> {
    const cacheKey = `${did}/${cid}`;
    const cached = await this.blobCacheRepository.get(cacheKey);
    if (cached) {
      this.logger.debug({ did, cid }, "Cache hit for blob");
      return cached;
    }

    this.logger.debug({ did, cid }, "Cache miss for blob, fetching from PDS");
    const pdsUrl = await this.resolvePdsService.resolve(did);
    const result = await this.blobFetcher.fetchBlob(pdsUrl, did, cid);

    await this.blobCacheRepository.set(cacheKey, result);
    this.logger.debug({ did, cid }, "Blob fetched and cached");

    return result;
  }
}
