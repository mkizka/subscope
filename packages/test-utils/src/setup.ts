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

const testInjector = createInjector()
  .provideValue("logLevel", "error" as const)
  .provideValue("databaseUrl", inject("databaseUrl"))
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory);

export const getTestSetup = () => {
  return {
    testInjector,
    ctx: {
      // typed-injectはデフォルトでシングルトンなので、getTestSetupを呼び出す度に同じクライアントインスタンスが使われるはず
      // https://github.com/nicojs/typed-inject/blob/5d3c0276e65ade1d683239346488708b7a11e443/README.md?plain=1#L266
      db: testInjector.resolve("db"),
    },
  };
};
