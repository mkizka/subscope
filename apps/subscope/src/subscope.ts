import {
  connectionPoolFactory,
  databaseFactory,
  JobQueue,
  LoggerManager,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { dashboardRouterFactory } from "./bootstrap/dashboard";
import { SubscopeServer } from "./bootstrap/server";
import { oauthClientFactory } from "./features/login/infrastructure/client";
import { OAuthSession } from "./features/login/infrastructure/session";
import {
  SessionStore,
  StateStore,
} from "./features/login/infrastructure/storage";
import { authMiddlewareFactory } from "./features/login/presentation/middleware";
import { loginRouterFactory } from "./features/login/presentation/router";
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
  .provideFactory("loginRouter", loginRouterFactory)
  .injectClass(SubscopeServer)
  .start();
