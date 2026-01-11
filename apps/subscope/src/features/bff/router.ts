import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { env } from "../../shared/env.js";
import { oauthClientFactory } from "./oauth/client.js";
import { authMiddlewareFactory } from "./oauth/middleware.js";
import { oauthRouterFactory } from "./oauth/oauth.js";
import { OAuthSession } from "./oauth/session.js";
import { SessionStore, StateStore } from "./oauth/storage.js";
import { trpcRouterFactory } from "./trpc/trpc-router.js";

const injector = createInjector()
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("databaseUrl", env.DATABASE_URL)
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("oauthStateStore", StateStore)
  .provideClass("oauthSessionStore", SessionStore)
  .provideFactory("oauthClient", oauthClientFactory)
  .provideClass("oauthSession", OAuthSession);

export const oauthRouter = injector.injectFunction(oauthRouterFactory);
export const authMiddleware = injector.injectFunction(authMiddlewareFactory);
export const trpcRouter = injector.injectFunction(trpcRouterFactory);
