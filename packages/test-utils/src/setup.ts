import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
  redisFactory,
  TransactionManager,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";
import { inject } from "vitest";

declare module "vitest" {
  interface ProvidedContext {
    databaseUrl: string;
    redisUrl: string;
  }
}

const testInjector = createInjector()
  .provideValue("logLevel", "error" as const)
  .provideValue("databaseUrl", inject("databaseUrl"))
  .provideValue("redisUrl", inject("redisUrl"))
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideFactory("redis", redisFactory)
  .provideClass("transactionManager", TransactionManager);

const db = testInjector.resolve("db");

export const testSetup = {
  testInjector,
  ctx: { db },
};
