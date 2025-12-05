import { schema } from "@repo/db";
import type { Logger as BaseDrizzleLogger } from "drizzle-orm/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { ILoggerManager, Logger } from "../domain/interfaces/logger.js";

export const connectionPoolFactory = (databaseUrl: string) => {
  return new Pool({
    connectionString: databaseUrl,
  });
};
connectionPoolFactory.inject = ["databaseUrl"] as const;

export const databaseFactory = (
  connectionPool: ReturnType<typeof connectionPoolFactory>,
  loggerManager: ILoggerManager,
) => {
  class DrizzleLogger implements BaseDrizzleLogger {
    private readonly logger: Logger;

    constructor() {
      this.logger = loggerManager.createLogger("db");
    }

    logQuery(query: string): void {
      this.logger.debug(query);
    }
  }

  return drizzle({
    client: connectionPool,
    schema,
    casing: "snake_case",
    logger: new DrizzleLogger(),
  });
};
databaseFactory.inject = ["connectionPool", "loggerManager"] as const;
