import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { env } from "../../shared/env.js";
import { ImageProxyUseCase } from "./application/image-proxy-use-case.js";
import { CacheCleanupScheduler } from "./application/services/cache-cleanup-scheduler.js";
import { CacheCleanupService } from "./application/services/cache-cleanup-service.js";
import { FetchBlobService } from "./application/services/fetch-blob-service.js";
import { ImageCacheService } from "./application/services/image-cache-service.js";
import { BlobFetcher } from "./infrastructure/blob-fetcher.js";
import { CacheMetadataRepository } from "./infrastructure/cache-metadata-repository.js";
import { CronTaskScheduler } from "./infrastructure/cron-task-scheduler.js";
import { ImageDiskStorage } from "./infrastructure/image-disk-storage.js";
import { ImageResizer } from "./infrastructure/image-resizer.js";
import { imagesRouterFactory } from "./presentation/images.js";

const blobProxyInjector = createInjector()
  // envs
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("plcUrl", env.ATPROTO_PLC_URL)
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("databaseUrl", env.DATABASE_URL)
  .provideValue("blobCacheDir", env.BLOB_CACHE_DIR)
  .provideValue("cacheCleanupCron", env.CACHE_CLEANUP_CRON)
  .provideValue("cacheCleanupTimezone", env.CACHE_CLEANUP_TIMEZONE)
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
  .provideClass("imageResizer", ImageResizer)
  .provideClass("taskScheduler", CronTaskScheduler)
  // application
  .provideClass("fetchBlobService", FetchBlobService)
  .provideClass("imageCacheService", ImageCacheService)
  .provideClass("cacheCleanupService", CacheCleanupService)
  .provideClass("cacheCleanupScheduler", CacheCleanupScheduler)
  // use case
  .provideClass("imageProxyUseCase", ImageProxyUseCase);

export const blobProxyRouter =
  blobProxyInjector.injectFunction(imagesRouterFactory);
export const cacheCleanupScheduler = blobProxyInjector.resolve(
  "cacheCleanupScheduler",
);
