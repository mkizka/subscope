import type { schema } from "@dawn/db";
import type { MySql2Database } from "drizzle-orm/mysql2";

export type DatabaseClient = MySql2Database<typeof schema>;

export type TransactionContext = {
  db: DatabaseClient;
};

export interface ITransactionManager {
  transaction: <T>(
    fn: (context: TransactionContext) => Promise<T>,
  ) => Promise<T>;
}
