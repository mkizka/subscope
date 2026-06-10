import { createRegistry } from "@gyaku/di";
import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
} from "@repo/common/infrastructure";
import { ac } from "@repo/common/utils";

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
import { BlobProxyServer } from "./presentation/server.js";
import { env } from "./shared/env.js";

// prettier-ignore
const services = await createRegistry()
  // envs
  .value("logLevel", env.LOG_LEVEL)
  .value("plcUrl", env.PLC_URL)
  .value("redisUrl", env.REDIS_URL)
  .value("databaseUrl", env.DATABASE_URL)
  .value("blobCacheDir", env.BLOB_CACHE_DIR)
  .value("cacheCleanupCron", env.CACHE_CLEANUP_CRON)
  .value("cacheCleanupTimezone", env.CACHE_CLEANUP_TIMEZONE)
  // infrastructure
  .service("loggerManager", ["logLevel"], ac(LoggerManager))
  .service("metricReporter", () => new MetricReporter())
  .service("connectionPool", ["databaseUrl"], ({ databaseUrl }) => connectionPoolFactory(databaseUrl))
  .service("db", ["connectionPool", "loggerManager"], ({ connectionPool, loggerManager }) => databaseFactory(connectionPool, loggerManager))
  .service("didCache", ["redisUrl", "metricReporter"], ac(RedisDidCache))
  .service("didResolver", ["plcUrl", "loggerManager", "didCache", "metricReporter"], ac(DidResolver))
  .service("imageCacheStorage", ["loggerManager"], ac(ImageDiskStorage))
  .service("cacheMetadataRepository", ["db"], ac(CacheMetadataRepository))
  .service("blobFetcher", ["didResolver"], ac(BlobFetcher))
  .service("imageResizer", () => new ImageResizer())
  .service("taskScheduler", ["loggerManager"], ac(CronTaskScheduler))
  // application
  .service("fetchBlobService", ["didResolver", "blobFetcher"], ac(FetchBlobService))
  .service("imageCacheService", ["cacheMetadataRepository", "imageCacheStorage", "blobCacheDir"], ac(ImageCacheService))
  .service("cacheCleanupService", ["cacheMetadataRepository", "imageCacheService"], ac(CacheCleanupService))
  .service("cacheCleanupScheduler", ["loggerManager", "taskScheduler", "cacheCleanupService", "cacheCleanupCron", "cacheCleanupTimezone"], ac(CacheCleanupScheduler))
  .service("imageProxyUseCase", ["fetchBlobService", "imageResizer", "imageCacheService", "metricReporter"], ac(ImageProxyUseCase))
  // presentation
  .service("imagesRouter", ["imageProxyUseCase", "metricReporter"], ({ imageProxyUseCase, metricReporter }) => imagesRouterFactory(imageProxyUseCase, metricReporter))
  .service("blobProxyServer", ["loggerManager", "imagesRouter", "cacheCleanupScheduler"], ac(BlobProxyServer))
  .resolve();

services.blobProxyServer.start();
