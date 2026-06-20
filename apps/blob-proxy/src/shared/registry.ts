import { asClassArgs, createRegistry } from "@gyaku/di";
import type {
  IDidCache,
  IDidResolver,
  ILoggerManager,
  IMetricReporter,
} from "@repo/common/domain";
import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
} from "@repo/common/infrastructure";

import { ImageProxyUseCase } from "../application/image-proxy-use-case.js";
import type { IBlobFetcher } from "../application/interfaces/blob-fetcher.js";
import type { ICacheMetadataRepository } from "../application/interfaces/cache-metadata-repository.js";
import type { IImageCacheStorage } from "../application/interfaces/image-cache-storage.js";
import type { IImageResizer } from "../application/interfaces/image-resizer.js";
import { CacheCleanupScheduler } from "../application/services/cache-cleanup-scheduler.js";
import { CacheCleanupService } from "../application/services/cache-cleanup-service.js";
import { FetchBlobService } from "../application/services/fetch-blob-service.js";
import { ImageCacheService } from "../application/services/image-cache-service.js";
import { BlobFetcher } from "../infrastructure/blob-fetcher.js";
import { CacheMetadataRepository } from "../infrastructure/cache-metadata-repository.js";
import { CronTaskScheduler } from "../infrastructure/cron-task-scheduler.js";
import { ImageDiskStorage } from "../infrastructure/image-disk-storage.js";
import { ImageResizer } from "../infrastructure/image-resizer.js";
import { imagesRouterFactory } from "../presentation/images.js";
import { healthRouterFactory } from "../presentation/routes/health.js";
import { BlobProxyServer } from "../presentation/server.js";
import type { Env } from "./env.js";

// prettier-ignore
export const createBlobProxyRegistry = (env: Env) =>
  createRegistry()
    // envs
    .value("logLevel", env.LOG_LEVEL)
    .value("nodeEnv", env.NODE_ENV)
    .value("plcUrl", env.PLC_URL)
    .value("redisUrl", env.REDIS_URL)
    .value("databaseUrl", env.DATABASE_URL)
    .value("blobCacheDir", env.BLOB_CACHE_DIR)
    .value("cacheCleanupCron", env.CACHE_CLEANUP_CRON)
    .value("cacheCleanupTimezone", env.CACHE_CLEANUP_TIMEZONE)
    .value("port", env.PORT)
    // infrastructure
    .service("loggerManager", ["logLevel"], asClassArgs<ILoggerManager>(LoggerManager))
    .service("metricReporter", asClassArgs<IMetricReporter>(MetricReporter))
    .service("connectionPool", ["databaseUrl"], ({ databaseUrl }) => connectionPoolFactory(databaseUrl))
    .service("db", ["connectionPool", "loggerManager"], ({ connectionPool, loggerManager }) => databaseFactory(connectionPool, loggerManager))
    .service("didCache", ["redisUrl", "metricReporter"], asClassArgs<IDidCache>(RedisDidCache))
    .service("didResolver", ["plcUrl", "loggerManager", "didCache", "metricReporter"], asClassArgs<IDidResolver>(DidResolver))
    .service("imageCacheStorage", ["loggerManager"], asClassArgs<IImageCacheStorage>(ImageDiskStorage))
    .service("cacheMetadataRepository", ["db"], asClassArgs<ICacheMetadataRepository>(CacheMetadataRepository))
    .service("blobFetcher", ["didResolver"], asClassArgs<IBlobFetcher>(BlobFetcher))
    .service("imageResizer", asClassArgs<IImageResizer>(ImageResizer))
    .service("taskScheduler", ["loggerManager"], asClassArgs(CronTaskScheduler))
    // application
    .service("fetchBlobService", ["didResolver", "blobFetcher"], asClassArgs(FetchBlobService))
    .service("imageCacheService", ["cacheMetadataRepository", "imageCacheStorage", "blobCacheDir"], asClassArgs(ImageCacheService))
    .service("cacheCleanupService", ["cacheMetadataRepository", "imageCacheService"], asClassArgs(CacheCleanupService))
    .service("cacheCleanupScheduler", ["loggerManager", "taskScheduler", "cacheCleanupService", "cacheCleanupCron", "cacheCleanupTimezone"], asClassArgs(CacheCleanupScheduler))
    .service("imageProxyUseCase", ["fetchBlobService", "imageResizer", "imageCacheService", "metricReporter"], asClassArgs(ImageProxyUseCase))
    // presentation
    .service("imagesRouter", ["imageProxyUseCase", "metricReporter"], ({ imageProxyUseCase, metricReporter }) => imagesRouterFactory(imageProxyUseCase, metricReporter))
    .service("healthRouter", ["nodeEnv", "logLevel", "port"], ({ nodeEnv, logLevel, port }) => healthRouterFactory({ NODE_ENV: nodeEnv, LOG_LEVEL: logLevel, PORT: port }))
    .service("blobProxyServer", ["loggerManager", "imagesRouter", "cacheCleanupScheduler", "healthRouter", "port"], asClassArgs(BlobProxyServer));
