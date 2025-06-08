import {
  DidResolver,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
} from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { BlobProxyService } from "./application/blob-proxy-service.js";
import { ResolvePdsService } from "./application/resolve-pds-service.js";
import { BlobCacheRepository } from "./infrastructure/blob-cache-repository.js";
import { BlobFetcher } from "./infrastructure/blob-fetcher.js";
import { blobRouterFactory } from "./presentation/routes/blob.js";
import { BlobProxyServer } from "./presentation/server.js";
import { env } from "./shared/env.js";

createInjector()
  // envs
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("plcUrl", env.PLC_URL)
  .provideValue("redisUrl", env.REDIS_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideClass("metricReporter", MetricReporter)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("blobCacheRepository", BlobCacheRepository)
  .provideClass("blobFetcher", BlobFetcher)
  // application
  .provideClass("resolvePdsService", ResolvePdsService)
  .provideClass("blobProxyService", BlobProxyService)
  // presentation
  .provideFactory("blobRouter", blobRouterFactory)
  .injectClass(BlobProxyServer)
  .start();
