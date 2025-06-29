import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
} from "@repo/common/infrastructure";
import { required } from "@repo/common/utils";
import { createInjector } from "typed-inject";

export const getTestSetup = () => {
  const testInjector = createInjector()
    .provideValue("logLevel", "error" as const)
    .provideValue("databaseUrl", required(process.env.TEST_DATABASE_URL))
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
