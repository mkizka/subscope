import {
  DidResolver,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
} from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { ImageTransformService } from "./application/image-transform-service.js";
import { ResolvePdsService } from "./application/resolve-pds-service.js";
import { ImageTransformationService } from "./domain/services/image-transformation-service.js";
import { BlobCacheRepository } from "./infrastructure/blob-cache-repository.js";
import { BlobFetcher } from "./infrastructure/blob-fetcher.js";
import { imagesRouterFactory } from "./presentation/routes/images.js";
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
  // domain
  .provideClass("imageTransformationService", ImageTransformationService)
  // application
  .provideClass("resolvePdsService", ResolvePdsService)
  .provideClass("imageTransformService", ImageTransformService)
  // presentation
  .provideFactory("imagesRouter", imagesRouterFactory)
  .injectClass(BlobProxyServer)
  .start();
