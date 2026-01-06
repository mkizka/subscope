import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { env } from "../../shared/env";
import { oauthClientFactory } from "./infrastructure/client";
import { OAuthSession } from "./infrastructure/session";
import { SessionStore, StateStore } from "./infrastructure/storage";
import { authMiddlewareFactory } from "./presentation/middleware";
import { oauthRouterFactory } from "./presentation/oauth";

const oauthInjector = createInjector()
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("databaseUrl", env.DATABASE_URL)
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("oauthStateStore", StateStore)
  .provideClass("oauthSessionStore", SessionStore)
  .provideFactory("oauthClient", oauthClientFactory)
  .provideClass("oauthSession", OAuthSession);

export const oauthRouter = oauthInjector.injectFunction(oauthRouterFactory);
export const authMiddleware = oauthInjector.injectFunction(
  authMiddlewareFactory,
);
