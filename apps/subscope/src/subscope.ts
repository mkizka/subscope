import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  JobQueue,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { SubscopeServer } from "./bootstrap/server.js";
import { oauthClientFactory } from "./features/bff/oauth/client.js";
import { authMiddlewareFactory } from "./features/bff/oauth/middleware.js";
import { oauthRouterFactory } from "./features/bff/oauth/oauth.js";
import { OAuthSession } from "./features/bff/oauth/session.js";
import { SessionStore, StateStore } from "./features/bff/oauth/storage.js";
import { trpcRouterFactory } from "./features/bff/trpc/trpc-router.js";
import { ImageProxyUseCase } from "./features/blob-proxy/application/image-proxy-use-case.js";
import { CacheCleanupScheduler } from "./features/blob-proxy/application/services/cache-cleanup-scheduler.js";
import { CacheCleanupService } from "./features/blob-proxy/application/services/cache-cleanup-service.js";
import { FetchBlobService } from "./features/blob-proxy/application/services/fetch-blob-service.js";
import { ImageCacheService } from "./features/blob-proxy/application/services/image-cache-service.js";
import { BlobFetcher } from "./features/blob-proxy/infrastructure/blob-fetcher.js";
import { CacheMetadataRepository } from "./features/blob-proxy/infrastructure/cache-metadata-repository.js";
import { CronTaskScheduler } from "./features/blob-proxy/infrastructure/cron-task-scheduler.js";
import { ImageDiskStorage } from "./features/blob-proxy/infrastructure/image-disk-storage.js";
import { ImageResizer } from "./features/blob-proxy/infrastructure/image-resizer.js";
import { imagesRouterFactory } from "./features/blob-proxy/presentation/images.js";
import { clientRouter } from "./features/client/router.js";
import { dashboardRouterFactory } from "./features/dashboard/dashboard.js";
import { env } from "./shared/env.js";

createInjector()
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
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("oauthStateStore", StateStore)
  .provideClass("oauthSessionStore", SessionStore)
  .provideFactory("oauthClient", oauthClientFactory)
  .provideClass("oauthSession", OAuthSession)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("imageCacheStorage", ImageDiskStorage)
  .provideClass("cacheMetadataRepository", CacheMetadataRepository)
  .provideClass("blobFetcher", BlobFetcher)
  .provideClass("imageResizer", ImageResizer)
  .provideClass("taskScheduler", CronTaskScheduler)
  .provideClass("jobQueue", JobQueue)
  // application
  .provideClass("fetchBlobService", FetchBlobService)
  .provideClass("imageCacheService", ImageCacheService)
  .provideClass("cacheCleanupService", CacheCleanupService)
  .provideClass("cacheCleanupScheduler", CacheCleanupScheduler)
  .provideClass("imageProxyUseCase", ImageProxyUseCase)
  // presentation
  .provideFactory("authMiddleware", authMiddlewareFactory)
  .provideFactory("oauthRouter", oauthRouterFactory)
  .provideFactory("trpcRouter", trpcRouterFactory)
  .provideFactory("blobProxyRouter", imagesRouterFactory)
  .provideValue("clientRouter", clientRouter)
  .provideFactory("dashboardRouter", dashboardRouterFactory)
  // bootstrap
  .injectClass(SubscopeServer)
  .start();
