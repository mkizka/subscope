import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
  TransactionManager,
} from "@repo/common/infrastructure";
import { schema } from "@repo/db";
import { createInjector } from "typed-inject";
import { inject } from "vitest";

declare module "vitest" {
  interface ProvidedContext {
    databaseUrl: string;
  }
}

const testInjector = createInjector()
  .provideValue("logLevel", "error" as const)
  .provideValue("databaseUrl", inject("databaseUrl"))
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("transactionManager", TransactionManager);

const db = testInjector.resolve("db");

const refreshSubscriberFollowees = async () => {
  await db.refreshMaterializedView(schema.subscriberFollowees);
};

export const testSetup = {
  testInjector,
  ctx: { db },
  refreshSubscriberFollowees,
};
