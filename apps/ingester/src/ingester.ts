import {
  JobQueue,
  LoggerManager,
  MetricReporter,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { HandleCommitUseCase } from "./application/handle-commit-use-case.js";
import { HandleIdentityUseCase } from "./application/handle-identity-use-case.js";
import { LabelIngester } from "./presentation/label.js";
import { healthRouterFactory } from "./presentation/routes/health.js";
import { metricsRouterFactory } from "./presentation/routes/metrics.js";
import { IngesterServer } from "./presentation/server.js";
import { TapIngester } from "./presentation/tap.js";
import { env } from "./shared/env.js";

createInjector()
  // envs
  .provideValue("nodeEnv", env.NODE_ENV)
  .provideValue("port", env.PORT)
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("tapUrl", env.TAP_URL)
  .provideValue("moderationUrl", env.MODERATION_URL)
  .provideValue("disableIngester", env.DISABLE_INGESTER)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideClass("jobQueue", JobQueue)
  .provideClass("metricReporter", MetricReporter)
  // application
  .provideClass("handleIdentityUseCase", HandleIdentityUseCase)
  .provideClass("handleCommitUseCase", HandleCommitUseCase)
  // presentation
  .provideFactory("healthRouter", healthRouterFactory)
  .provideFactory("metricsRouter", metricsRouterFactory)
  .provideClass("tapIngester", TapIngester)
  .provideClass("labelIngester", LabelIngester)
  .injectClass(IngesterServer)
  .start();
