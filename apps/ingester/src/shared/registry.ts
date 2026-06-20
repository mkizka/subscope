import { createRegistry } from "@gyaku/di";
import {
  JobQueue,
  LoggerManager,
  MetricReporter,
} from "@repo/common/infrastructure";
import { ac } from "@repo/common/utils";

import { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";
import { RedisCursorRepository } from "../infrastructure/redis-cursor-repository.js";
import { LabelIngester } from "../presentation/label.js";
import { healthRouterFactory } from "../presentation/routes/health.js";
import { metricsRouterFactory } from "../presentation/routes/metrics.js";
import { IngesterServer } from "../presentation/server.js";
import { TapIngester } from "../presentation/tap.js";
import type { Env } from "./env.js";

// prettier-ignore
export const createIngesterRegistry = (env: Env) =>
  createRegistry()
    // envs
    .value("logLevel", env.LOG_LEVEL)
    .value("nodeEnv", env.NODE_ENV)
    .value("redisUrl", env.REDIS_URL)
    .value("port", env.PORT)
    .value("moderationUrl", env.MODERATION_URL)
    .value("disableIngester", env.DISABLE_INGESTER)
    .value("tapUrl", env.TAP_URL)
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
    .service("healthRouter", ["nodeEnv", "logLevel", "port"], ({ nodeEnv, logLevel, port }) => healthRouterFactory({ NODE_ENV: nodeEnv, LOG_LEVEL: logLevel, PORT: port }))
    .service("tapIngester", ["loggerManager", "handleCommitUseCase", "handleIdentityUseCase", "tapUrl"], ac(TapIngester))
    .service("labelIngester", ["metricReporter", "moderationUrl"], ac(LabelIngester))
    .service("ingesterServer", ["loggerManager", "metricsRouter", "healthRouter", "tapIngester", "labelIngester", "port", "disableIngester"], ac(IngesterServer));
