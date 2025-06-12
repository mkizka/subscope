import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { CacheCleanupService } from "./application/cache-cleanup-service.js";
import { CacheScheduler } from "./application/cache-scheduler.js";
import { FetchBlobService } from "./application/fetch-blob-service.js";
import { ImageCacheService } from "./application/image-cache-service.js";
import { ImageTransformService } from "./application/image-transform-service.js";
import { ImageBlobService } from "./domain/services/image-blob-service.js";
import { BlobFetcher } from "./infrastructure/blob-fetcher.js";
import { CacheMetadataRepository } from "./infrastructure/cache-metadata-repository.js";
import { ImageDiskStorage } from "./infrastructure/image-disk-storage.js";
import { imagesRouterFactory } from "./presentation/routes/images.js";
import { BlobProxyServer } from "./presentation/server.js";
import { env } from "./shared/env.js";

createInjector()
  // envs
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("plcUrl", env.PLC_URL)
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("databaseUrl", env.DATABASE_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideClass("metricReporter", MetricReporter)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("imageCacheStorage", ImageDiskStorage)
  .provideClass("cacheMetadataRepository", CacheMetadataRepository)
  .provideClass("blobFetcher", BlobFetcher)
  // domain
  .provideClass("imageBlobService", ImageBlobService)
  // application
  .provideClass("fetchBlobService", FetchBlobService)
  .provideClass("imageCacheService", ImageCacheService)
  .provideClass("imageTransformService", ImageTransformService)
  .provideClass("cacheCleanupService", CacheCleanupService)
  .provideClass("cacheScheduler", CacheScheduler)
  // presentation
  .provideFactory("imagesRouter", imagesRouterFactory)
  .injectClass(BlobProxyServer)
  .start();
