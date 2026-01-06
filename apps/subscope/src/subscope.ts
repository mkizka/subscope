import {
  connectionPoolFactory,
  databaseFactory,
  JobQueue,
  LoggerManager,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { dashboardRouterFactory } from "./bootstrap/dashboard";
import { SubscopeServer } from "./bootstrap/server";
import { oauthClientFactory } from "./features/oauth/infrastructure/client";
import { OAuthSession } from "./features/oauth/infrastructure/session";
import {
  SessionStore,
  StateStore,
} from "./features/oauth/infrastructure/storage";
import { authMiddlewareFactory } from "./features/oauth/presentation/middleware";
import { oauthRouterFactory } from "./features/oauth/presentation/router";
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
