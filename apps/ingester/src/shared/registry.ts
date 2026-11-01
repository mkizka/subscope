import { asClassArgs, asFunctionArgs, createRegistry } from "@gyaku/di";
import {
  JobQueue,
  LoggerManager,
  MetricReporter,
} from "@repo/common/infrastructure";

import { healthRouterFactory } from "../presentation/routes/health.js";
import { metricsRouterFactory } from "../presentation/routes/metrics.js";
import { IngesterServer } from "../presentation/server.js";
import type { Env } from "./env.js";

// prettier-ignore
export const createIngesterRegistry = (env: Env) =>
  createRegistry()
    // envs
    .value("logLevel", env.LOG_LEVEL)
    .value("nodeEnv", env.NODE_ENV)
    .value("redisUrl", env.REDIS_URL)
    .value("port", env.PORT)
    // infrastructure
    .service("loggerManager", ["logLevel"], asClassArgs(LoggerManager))
    .service("jobQueue", ["redisUrl"], asClassArgs(JobQueue))
    .service("metricReporter", asClassArgs(MetricReporter))
    // presentation
    .service("metricsRouter", ["jobQueue", "metricReporter"], asFunctionArgs(metricsRouterFactory))
    .service("healthRouter", ["nodeEnv", "logLevel", "port"], healthRouterFactory)
    .service("ingesterServer", ["loggerManager", "port", "metricsRouter", "healthRouter"], asClassArgs(IngesterServer));
