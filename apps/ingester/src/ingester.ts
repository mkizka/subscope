import { JobQueue, LoggerManager } from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { JetstreamIngester } from "./server/jetstream.js";
import { dashboardRouterFactory } from "./server/routes/dashboard.js";
import { metricsRouterFactory } from "./server/routes/metrics.js";
import { IngesterServer } from "./server/server.js";
import { env } from "./shared/env.js";

createInjector()
  .provideValue("config", { ...env, DATABASE_URL: "" }) // TODO: logger用の設定を分ける
  .provideClass("loggerManager", LoggerManager)
  .provideValue("redisUrl", env.REDIS_URL)
  .provideClass("jobQueue", JobQueue)
  .provideFactory("dashboardRouter", dashboardRouterFactory)
  .provideFactory("metricsRouter", metricsRouterFactory)
  .provideClass("ingester", JetstreamIngester)
  .injectClass(IngesterServer)
  .start();
