import { IConfig } from "../domain/interfaces/config.js";
import { ILoggerManager, Logger } from "../domain/interfaces/logger.js";
import { Logger as BaseDrizzleLogger } from "drizzle-orm/logger";
import { schema } from "@dawn/db";
import { drizzle } from "drizzle-orm/mysql2";

export const databaseFactory = (
  config: IConfig,
  loggerManager: ILoggerManager,
) => {
  class DrizzleLogger implements BaseDrizzleLogger {
    private readonly logger: Logger;

    constructor() {
      this.logger = loggerManager.createLogger("db");
    }

    logQuery(query: string, _params: unknown[]): void {
      this.logger.debug(query);
    }
  }
  return drizzle({
    connection: config.DATABASE_URL,
    schema,
    mode: "default",
    logger: new DrizzleLogger(),
  });
};
databaseFactory.inject = ["config", "loggerManager"] as const;
