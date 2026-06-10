import { createRegistry } from "@gyaku/di";
import {
  InMemoryDidResolver,
  InMemoryLoggerManager,
  InMemoryMetricReporter,
} from "@repo/common/infrastructure";
import { ac } from "@repo/common/utils";

import { ImageProxyUseCase } from "./application/image-proxy-use-case.js";
import { FetchBlobService } from "./application/services/fetch-blob-service.js";
import { ImageCacheService } from "./application/services/image-cache-service.js";
import { InMemoryBlobFetcher } from "./infrastructure/blob-fetcher.in-memory.js";
import { InMemoryCacheMetadataRepository } from "./infrastructure/cache-metadata-repository.in-memory.js";
import { InMemoryImageCacheStorage } from "./infrastructure/image-cache-storage.in-memory.js";
import { InMemoryImageResizer } from "./infrastructure/image-resizer.in-memory.js";

// prettier-ignore
export const testRegistry = createRegistry()
  .service("didResolver", () => new InMemoryDidResolver())
  .service("blobFetcher", () => new InMemoryBlobFetcher())
  .service("imageCacheStorage", () => new InMemoryImageCacheStorage())
  .service("imageResizer", () => new InMemoryImageResizer())
  .service("metricReporter", () => new InMemoryMetricReporter())
  .service("loggerManager", () => new InMemoryLoggerManager())
  .service("cacheMetadataRepository", () => new InMemoryCacheMetadataRepository())
  .value("blobCacheDir", "cache")
  .service("fetchBlobService", ["didResolver", "blobFetcher"], ac(FetchBlobService))
  .service("imageCacheService", ["cacheMetadataRepository", "imageCacheStorage", "blobCacheDir"], ac(ImageCacheService))
  .service("imageProxyUseCase", ["fetchBlobService", "imageResizer", "imageCacheService", "metricReporter"], ac(ImageProxyUseCase), );

export type TestServices = Awaited<ReturnType<typeof testRegistry.resolve>>;
