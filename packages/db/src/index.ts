import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema.js";

export { schema };

export const createDatabase = (url: string) => {
  return drizzle({
    connection: url,
    schema,
    mode: "default",
  });
};

export type DatabaseClient = ReturnType<typeof createDatabase>;

export type TransactionClient = Parameters<
  Parameters<DatabaseClient["transaction"]>[0]
>[0];
