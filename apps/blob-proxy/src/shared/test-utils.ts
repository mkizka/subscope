import { InMemoryDidResolver } from "@repo/common/infrastructure";
import { InMemoryMetricReporter } from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";
import { beforeEach } from "vitest";

import { FetchBlobService } from "../application/services/fetch-blob-service.js";
import { ImageCacheService } from "../application/services/image-cache-service.js";
import { InMemoryBlobFetcher } from "../infrastructure/blob-fetcher.in-memory.js";
import { InMemoryCacheMetadataRepository } from "../infrastructure/cache-metadata-repository.in-memory.js";
import { InMemoryImageCacheStorage } from "../infrastructure/image-cache-storage.in-memory.js";
import { InMemoryImageResizer } from "../infrastructure/image-resizer.in-memory.js";

export const testInjector = createInjector()
  .provideClass("didResolver", InMemoryDidResolver)
  .provideClass("blobFetcher", InMemoryBlobFetcher)
  .provideClass("imageCacheStorage", InMemoryImageCacheStorage)
  .provideClass("imageResizer", InMemoryImageResizer)
  .provideClass("metricReporter", InMemoryMetricReporter)
  .provideClass("cacheMetadataRepository", InMemoryCacheMetadataRepository)
  .provideClass("fetchBlobService", FetchBlobService)
  .provideClass("imageCacheService", ImageCacheService);

export const setupFiles = () => {
  beforeEach(() => {
    testInjector.resolve("didResolver").clear();
    testInjector.resolve("blobFetcher").clear();
    testInjector.resolve("imageCacheStorage").clear();
    testInjector.resolve("imageResizer").clear();
    testInjector.resolve("metricReporter").clear();
    testInjector.resolve("cacheMetadataRepository").clear();
  });
};
