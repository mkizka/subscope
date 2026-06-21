import { asClassArgs, createRegistry } from "@gyaku/di";
import {
  JobQueue,
  LoggerManager,
  MetricReporter,
} from "@repo/common/infrastructure";

import { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";
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
    .service("loggerManager", ["logLevel"], asClassArgs(LoggerManager))
    .service("jobQueue", ["redisUrl"], asClassArgs(JobQueue))
    .service("metricReporter", () => new MetricReporter())
    // application
    .service("handleIdentityUseCase", ["loggerManager", "metricReporter", "jobQueue"], asClassArgs(HandleIdentityUseCase))
    .service("handleCommitUseCase", ["loggerManager", "metricReporter", "jobQueue"], asClassArgs(HandleCommitUseCase))
    // presentation
    .service("metricsRouter", ["jobQueue", "metricReporter"], ({ jobQueue, metricReporter }) => metricsRouterFactory(jobQueue, metricReporter))
    .service("healthRouter", ["nodeEnv", "logLevel", "port"], ({ nodeEnv, logLevel, port }) => healthRouterFactory({ NODE_ENV: nodeEnv, LOG_LEVEL: logLevel, PORT: port }))
    .service("tapIngester", ["loggerManager", "handleCommitUseCase", "handleIdentityUseCase", "tapUrl"], asClassArgs(TapIngester))
    .service("labelIngester", ["metricReporter", "moderationUrl"], asClassArgs(LabelIngester))
    .service("ingesterServer", ["loggerManager", "port", "disableIngester", "metricsRouter", "healthRouter", "tapIngester", "labelIngester"], asClassArgs(IngesterServer));
