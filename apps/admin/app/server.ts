import { JobQueue, LoggerManager } from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { appFactory } from "./server/app.js";
import { env } from "./server/env.js";
import { dashboardRouterFactory } from "./server/routes/dashboard.js";

export const app = createInjector()
  // envs
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("logLevel", env.LOG_LEVEL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideClass("jobQueue", JobQueue)
  // presentation
  .provideFactory("dashboardRouter", dashboardRouterFactory)
  .injectFunction(appFactory);
