import {
  JobQueue,
  LoggerManager,
  MetricReporter,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { HandleCommitUseCase } from "./application/handle-commit-use-case.js";
import { HandleIdentityUseCase } from "./application/handle-identity-use-case.js";
import { RedisCursorRepository } from "./infrastructure/redis-cursor-repository.js";
import { LabelIngester } from "./presentation/label.js";
import { metricsRouterFactory } from "./presentation/routes/metrics.js";
import { IngesterServer } from "./presentation/server.js";
import { TapIngester } from "./presentation/tap.js";
import { env } from "./shared/env.js";

createInjector()
  // envs
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("redisUrl", env.REDIS_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideClass("jobQueue", JobQueue)
  .provideClass("metricReporter", MetricReporter)
  .provideClass("cursorRepository", RedisCursorRepository)
  // application
  .provideClass("handleIdentityUseCase", HandleIdentityUseCase)
  .provideClass("handleCommitUseCase", HandleCommitUseCase)
  // presentation
  .provideFactory("metricsRouter", metricsRouterFactory)
  .provideClass("tapIngester", TapIngester)
  .provideClass("labelIngester", LabelIngester)
  .injectClass(IngesterServer)
  .start();
