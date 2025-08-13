import {
  connectionPoolFactory,
  databaseFactory,
  JobQueue,
  LoggerManager,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { appFactory } from "./app";
import { env } from "./env";
import { authMiddlewareFactory } from "./middleware/auth";
import { oauthClientFactory } from "./oauth/client";
import { OAuthSession } from "./oauth/session";
import { SessionStore, StateStore } from "./oauth/storage";
import { dashboardRouterFactory } from "./routes/dashboard";

const injector = createInjector()
  // envs
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("databaseUrl", env.DATABASE_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("jobQueue", JobQueue)
  // presentation
  .provideClass("oauthStateStore", StateStore)
  .provideClass("oauthSessionStore", SessionStore)
  .provideFactory("oauthClient", oauthClientFactory)
  .provideClass("oauthSession", OAuthSession)
  .provideFactory("authMiddleware", authMiddlewareFactory)
  .provideFactory("dashboardRouter", dashboardRouterFactory)
  .provideFactory("app", appFactory);

export const loggerManager = injector.resolve("loggerManager");
export const oauthClient = await injector.resolve("oauthClient");
export const oauthSession = injector.resolve("oauthSession");
export const app = injector.resolve("app");
