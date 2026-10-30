import { asClassArgs, asFunctionArgs, createRegistry } from "@gyaku/di";
import type { IJobQueue } from "@repo/common/domain";
import {
  connectionPoolFactory,
  databaseFactory,
  JobQueue,
  LoggerManager,
} from "@repo/common/infrastructure";

import { CookieSession } from "../infrastructure/cookie-session.js";
import { createOAuthClient } from "../infrastructure/oauth-client.js";
import { type Env, isProduction } from "./env.js";

// prettier-ignore
export const createWebRegistry = (env: Env) =>
  createRegistry()
    // envs
    .value("logLevel", env.LOG_LEVEL)
    .value("redisUrl", env.REDIS_URL)
    .value("databaseUrl", env.DATABASE_URL)
    .value("publicUrl", env.PUBLIC_URL)
    .value("privateKeyB64", env.PRIVATE_KEY_ES256_B64)
    .value("isProduction", isProduction)
    .value("plcUrl", env.ATPROTO_PLC_URL)
    .value("handleResolverUrl", env.ATPROTO_HANDLE_RESOLVER_URL)
    .value("appviewDid", env.APPVIEW_DID)
    .value("cookieSecret", env.COOKIE_SECRET)
    .value("secureCookie", env.NODE_ENV === "production")
    // infrastructure
    .service("loggerManager", ["logLevel"], asClassArgs(LoggerManager))
    .service("connectionPool", ["databaseUrl"], asFunctionArgs(connectionPoolFactory))
    .service("db", ["connectionPool", "loggerManager"], asFunctionArgs(databaseFactory))
    .service("jobQueue", ["redisUrl"], asClassArgs<IJobQueue>()(JobQueue))
    .service("cookieSession", ["cookieSecret", "secureCookie"], asClassArgs(CookieSession))
    .service("oauthClient", ["publicUrl", "privateKeyB64", "isProduction", "plcUrl", "handleResolverUrl", "appviewDid", "db", "loggerManager"], asFunctionArgs(createOAuthClient));
