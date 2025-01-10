import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema.js";
import { Logger } from "drizzle-orm/logger";
import { env } from "process";
export { schema };

type Options = {
  url: string;
  logger?: {
    info: (obj: unknown, message?: string) => void;
  };
  enableLogger?: boolean;
};

const defaultEnableLogger = env.NODE_ENV === "development";

export const createDatabase = ({
  url,
  logger,
  enableLogger = defaultEnableLogger,
}: Options) => {
  class MyLogger implements Logger {
    logQuery(query: string, _params: unknown[]): void {
      if (!enableLogger) return;
      logger?.info(query);
    }
  }
  return drizzle({
    connection: url,
    schema,
    mode: "default",
    logger: new MyLogger(),
  });
};

export type DatabaseClient = ReturnType<typeof createDatabase>;

export type TransactionClient = Parameters<
  Parameters<DatabaseClient["transaction"]>[0]
>[0];
