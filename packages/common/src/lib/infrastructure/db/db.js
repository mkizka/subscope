import { schema } from "@repo/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
export const connectionPoolFactory = (databaseUrl) => {
  return new Pool({
    connectionString: databaseUrl,
  });
};
export const databaseFactory = (connectionPool, loggerManager) => {
  class DrizzleLogger {
    logger;
    constructor() {
      this.logger = loggerManager.createLogger("db");
    }
    logQuery(query) {
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
