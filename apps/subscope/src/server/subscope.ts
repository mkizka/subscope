import { JobQueue, LoggerManager } from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { dashboardRouterFactory } from "./presentation/dashboard";
import { SubscopeServer } from "./presentation/server";
import { env } from "./shared/env";

createInjector()
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideClass("loggerManager", LoggerManager)
  .provideClass("jobQueue", JobQueue)
  .provideFactory("dashboardRouter", dashboardRouterFactory)
  .injectClass(SubscopeServer)
  .start();
