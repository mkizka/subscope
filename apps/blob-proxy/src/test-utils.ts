import { asClassArgs } from "@gyaku/di";
import {
  InMemoryDidResolver,
  InMemoryLoggerManager,
  InMemoryMetricReporter,
} from "@repo/common/infrastructure";
import { InMemoryDidCache } from "@repo/common/test";

import { InMemoryBlobFetcher } from "./infrastructure/blob-fetcher.in-memory.js";
import { InMemoryCacheMetadataRepository } from "./infrastructure/cache-metadata-repository.in-memory.js";
import { InMemoryImageCacheStorage } from "./infrastructure/image-cache-storage.in-memory.js";
import { InMemoryImageResizer } from "./infrastructure/image-resizer.in-memory.js";
import type { Env } from "./shared/env.js";
import { createBlobProxyRegistry } from "./shared/registry.js";

const testEnv = {
  NODE_ENV: "test",
  LOG_LEVEL: "error",
  PORT: 3002,
  PLC_URL: "https://plc.directory",
  DATABASE_URL: "postgresql://postgres:password@localhost:5432/postgres",
  REDIS_URL: "redis://localhost:6379",
  BLOB_CACHE_DIR: "cache",
  CACHE_CLEANUP_CRON: "* * * * *",
  CACHE_CLEANUP_TIMEZONE: "Asia/Tokyo",
} satisfies Env;

// prettier-ignore
export const testRegistry = createBlobProxyRegistry(testEnv)
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .replaceValue("db", {} as never)
  // blobProxyServerはexpress-prom-bundleでprom-clientのメトリクスを登録するため、
  // beforeEachで複数回resolveすると二重登録エラーになる。テストでは使わないので差し替える。
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .replaceValue("blobProxyServer", {} as never)
  .replaceService("loggerManager", asClassArgs(InMemoryLoggerManager))
  .replaceService("metricReporter", asClassArgs(InMemoryMetricReporter))
  .replaceService("didCache", asClassArgs(InMemoryDidCache))
  .replaceService("didResolver", asClassArgs(InMemoryDidResolver))
  .replaceService("imageCacheStorage", asClassArgs(InMemoryImageCacheStorage))
  .replaceService("cacheMetadataRepository", asClassArgs(InMemoryCacheMetadataRepository))
  .replaceService("blobFetcher", asClassArgs(InMemoryBlobFetcher))
  .replaceService("imageResizer", asClassArgs(InMemoryImageResizer));

export type TestServices = Awaited<ReturnType<typeof testRegistry.resolve>>;
