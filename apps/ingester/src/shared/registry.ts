import { asClassArgs, asFunctionArgs, createRegistry } from "@gyaku/di";
import {
  JobQueue,
  LoggerManager,
  MetricReporter,
} from "@repo/common/infrastructure";

import type { ILabelCursorStore } from "../application/interfaces/label-cursor-store.js";
import { LabelCursorStore } from "../infrastructure/label-cursor-store.js";
import { LabelIngester } from "../presentation/label.js";
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
    .value("moderationUrl", env.MODERATION_URL)
    .value("disableIngester", env.DISABLE_INGESTER)
    // infrastructure
    .service("loggerManager", ["logLevel"], asClassArgs(LoggerManager))
    .service("jobQueue", ["redisUrl"], asClassArgs(JobQueue))
    .service("metricReporter", asClassArgs(MetricReporter))
    .service("labelCursorStore", ["redisUrl"], asClassArgs<ILabelCursorStore>()(LabelCursorStore))
    // presentation
    .service("metricsRouter", ["jobQueue", "metricReporter"], asFunctionArgs(metricsRouterFactory))
    .service("healthRouter", ["nodeEnv", "logLevel", "port"], healthRouterFactory)
    .service("labelIngester", ["metricReporter", "jobQueue", "labelCursorStore", "moderationUrl"], asClassArgs(LabelIngester))
    .service("ingesterServer", ["loggerManager", "port", "disableIngester", "metricsRouter", "healthRouter", "labelIngester"], asClassArgs(IngesterServer));
