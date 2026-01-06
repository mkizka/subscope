import {
  InMemoryDidResolver,
  InMemoryLoggerManager,
  InMemoryMetricReporter,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";
import { beforeEach } from "vitest";

import { FetchBlobService } from "../features/blob-proxy/application/services/fetch-blob-service.js";
import { ImageCacheService } from "../features/blob-proxy/application/services/image-cache-service.js";
import { InMemoryBlobFetcher } from "../features/blob-proxy/infrastructure/blob-fetcher.in-memory.js";
import { InMemoryCacheMetadataRepository } from "../features/blob-proxy/infrastructure/cache-metadata-repository.in-memory.js";
import { InMemoryImageCacheStorage } from "../features/blob-proxy/infrastructure/image-cache-storage.in-memory.js";
import { InMemoryImageResizer } from "../features/blob-proxy/infrastructure/image-resizer.in-memory.js";

export const testInjector = createInjector()
  .provideClass("didResolver", InMemoryDidResolver)
  .provideClass("blobFetcher", InMemoryBlobFetcher)
  .provideClass("imageCacheStorage", InMemoryImageCacheStorage)
  .provideClass("imageResizer", InMemoryImageResizer)
  .provideClass("metricReporter", InMemoryMetricReporter)
  .provideClass("loggerManager", InMemoryLoggerManager)
  .provideClass("cacheMetadataRepository", InMemoryCacheMetadataRepository)
  .provideValue("blobCacheDir", "cache")
  .provideClass("fetchBlobService", FetchBlobService)
  .provideClass("imageCacheService", ImageCacheService);

export const setupFiles = () => {
  beforeEach(() => {
    testInjector.resolve("didResolver").clear();
    testInjector.resolve("blobFetcher").clear();
    testInjector.resolve("imageCacheStorage").clear();
    testInjector.resolve("imageResizer").clear();
    testInjector.resolve("metricReporter").clear();
    testInjector.resolve("loggerManager").clear();
    testInjector.resolve("cacheMetadataRepository").clear();
  });
};
