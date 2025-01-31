import { schema } from "@dawn/db";
import type { Logger as BaseDrizzleLogger } from "drizzle-orm/logger";
import { drizzle } from "drizzle-orm/mysql2";

import type { ILoggerManager, Logger } from "../domain/interfaces/logger.js";

export const databaseFactory = (
  databaseUrl: string,
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
    connection: databaseUrl,
    schema,
    mode: "default",
    logger: new DrizzleLogger(),
  });
};
databaseFactory.inject = ["databaseUrl", "loggerManager"] as const;
