import {
  connectionPoolFactory,
  databaseFactory,
  JobQueue,
  LoggerManager,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { oauthClientFactory } from "./infrastructure/oauth/client";
import { OAuthSession } from "./infrastructure/oauth/session";
import { SessionStore, StateStore } from "./infrastructure/oauth/storage";
import { authMiddlewareFactory } from "./presentation/middlewares/auth";
import { dashboardRouterFactory } from "./presentation/routes/dashboard";
import { oauthRouterFactory } from "./presentation/routes/oauth";
import { SubscopeServer } from "./presentation/server";
import { env } from "./shared/env";

createInjector()
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("databaseUrl", env.DATABASE_URL)
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("jobQueue", JobQueue)
  .provideClass("oauthStateStore", StateStore)
  .provideClass("oauthSessionStore", SessionStore)
  .provideFactory("oauthClient", oauthClientFactory)
  .provideClass("oauthSession", OAuthSession)
  .provideFactory("authMiddleware", authMiddlewareFactory)
  .provideFactory("dashboardRouter", dashboardRouterFactory)
  .provideFactory("oauthRouter", oauthRouterFactory)
  .injectClass(SubscopeServer)
  .start();
