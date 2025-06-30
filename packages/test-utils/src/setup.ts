import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";
import { inject } from "vitest";

declare module "vitest" {
  interface ProvidedContext {
    databaseUrl: string;
  }
}

export const getTestSetup = () => {
  const testInjector = createInjector()
    .provideValue("logLevel", "error" as const)
    .provideValue("databaseUrl", inject("databaseUrl"))
    .provideClass("loggerManager", LoggerManager)
    .provideFactory("connectionPool", connectionPoolFactory)
    .provideFactory("db", databaseFactory);
  return {
    testInjector,
    ctx: {
      db: testInjector.resolve("db"),
    },
  };
};
