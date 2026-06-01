import { JobQueue, LoggerManager } from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { clientRouterFactory } from "@/server/features/client/router.js";
import { env } from "@/server/shared/env.js";

import { SubscopeServer } from "./subscope.js";

const server = createInjector()
  // envs
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("redisUrl", env.REDIS_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideClass("jobQueue", JobQueue)
  // presentation
  .provideFactory("clientRouter", clientRouterFactory)
  // bootstrap
  .injectClass(SubscopeServer);

// 本番環境ではこのファイルがReact Routerのビルド成果物に含まれるため、
// NODE_ENV=production node build/server/index.jsでサーバーが起動する
if (env.NODE_ENV === "production") {
  server.start();
}

// 開発環境ではこのserverインスタンスを使用して開発用Expressを起動する
export { server };
