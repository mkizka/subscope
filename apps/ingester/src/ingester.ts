import {
  JobQueue,
  LoggerManager,
  MetricReporter,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { HandleAccountUseCase } from "./application/handle-account-use-case.js";
import { HandleCommitUseCase } from "./application/handle-commit-use-case.js";
import { HandleIdentityUseCase } from "./application/handle-identity-use-case.js";
import { RedisCursorRepository } from "./infrastructure/redis-cursor-repository.js";
import { JetstreamIngester } from "./presentation/jetstream.js";
import { dashboardRouterFactory } from "./presentation/routes/dashboard.js";
import { metricsRouterFactory } from "./presentation/routes/metrics.js";
import { IngesterServer } from "./presentation/server.js";
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
  .provideClass("handleAccountUseCase", HandleAccountUseCase)
  .provideClass("handleIdentityUseCase", HandleIdentityUseCase)
  .provideClass("handleCommitUseCase", HandleCommitUseCase)
  // presentation
  .provideFactory("dashboardRouter", dashboardRouterFactory)
  .provideFactory("metricsRouter", metricsRouterFactory)
  .provideClass("ingester", JetstreamIngester)
  .injectClass(IngesterServer)
  .start();
