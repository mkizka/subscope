import { JobQueue, LoggerManager } from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { JetstreamIngester } from "./server/jetstream.js";
import { dashboardRouterFactory } from "./server/routes/dashboard.js";
import { metricsRouterFactory } from "./server/routes/metrics.js";
import { IngesterServer } from "./server/server.js";
import { env } from "./shared/env.js";

createInjector()
  // envs
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("redisUrl", env.REDIS_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideClass("jobQueue", JobQueue)
  // server
  .provideFactory("dashboardRouter", dashboardRouterFactory)
  .provideFactory("metricsRouter", metricsRouterFactory)
  .provideClass("ingester", JetstreamIngester)
  .injectClass(IngesterServer)
  .start();
