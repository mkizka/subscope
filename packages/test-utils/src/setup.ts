import { asClassArgs, asFunctionArgs, createRegistry } from "@gyaku/di";
import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
  TransactionManager,
} from "@repo/common/infrastructure";
import { inject } from "vitest";

declare module "vitest" {
  interface ProvidedContext {
    databaseUrl: string;
  }
}

// prettier-ignore
const testRegistry = createRegistry()
  .value("logLevel", "error" as const)
  .value("databaseUrl", inject("databaseUrl"))
  .service("loggerManager", ["logLevel"], asClassArgs(LoggerManager))
  .service("connectionPool", ["databaseUrl"], asFunctionArgs(connectionPoolFactory))
  .service("db", ["connectionPool", "loggerManager"], asFunctionArgs(databaseFactory))
  .service("transactionManager", ["db"], asClassArgs(TransactionManager));

const services = await testRegistry.resolve();

export const testSetup = {
  ctx: { db: services.db },
};
