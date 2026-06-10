import { createRegistry } from "@gyaku/di";
import {
  JobQueue,
  LoggerManager,
  MetricReporter,
} from "@repo/common/infrastructure";
import { ac } from "@repo/common/utils";

import { HandleCommitUseCase } from "./application/handle-commit-use-case.js";
import { HandleIdentityUseCase } from "./application/handle-identity-use-case.js";
import { RedisCursorRepository } from "./infrastructure/redis-cursor-repository.js";
import { LabelIngester } from "./presentation/label.js";
import { metricsRouterFactory } from "./presentation/routes/metrics.js";
import { IngesterServer } from "./presentation/server.js";
import { TapIngester } from "./presentation/tap.js";
import { env } from "./shared/env.js";

// prettier-ignore
const services = await createRegistry()
  // envs
  .value("logLevel", env.LOG_LEVEL)
  .value("redisUrl", env.REDIS_URL)
  // infrastructure
  .service("loggerManager", ["logLevel"], ac(LoggerManager))
  .service("jobQueue", ["redisUrl"], ac(JobQueue))
  .service("metricReporter", () => new MetricReporter())
  .service("cursorRepository", ["redisUrl"], ac(RedisCursorRepository))
  // application
  .service("handleIdentityUseCase", ["loggerManager", "metricReporter", "jobQueue"], ac(HandleIdentityUseCase))
  .service("handleCommitUseCase", ["loggerManager", "metricReporter", "jobQueue"], ac(HandleCommitUseCase))
  // presentation
  .service("metricsRouter", ["jobQueue", "metricReporter"], ({ jobQueue, metricReporter }) => metricsRouterFactory(jobQueue, metricReporter))
  .service("tapIngester", ["loggerManager", "handleCommitUseCase", "handleIdentityUseCase"], ac(TapIngester))
  .service("labelIngester", ["metricReporter"], ac(LabelIngester))
  .service("ingesterServer", ["loggerManager", "metricsRouter", "tapIngester", "labelIngester"], ac(IngesterServer))
  .resolve();

services.ingesterServer.start();
