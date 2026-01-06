import { JobQueue } from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { env } from "../../shared/env";
import { dashboardRouterFactory } from "./dashboard";

export const dashboardRouter = createInjector()
  .provideValue("redisUrl", env.REDIS_URL)
  .provideClass("jobQueue", JobQueue)
  .injectFunction(dashboardRouterFactory);
