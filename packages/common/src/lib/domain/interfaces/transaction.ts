import type { schema } from "@repo/db";
import type { drizzle } from "drizzle-orm/node-postgres";

export type DatabaseClient = ReturnType<typeof drizzle<typeof schema>>;

export type TransactionContext = {
  db: DatabaseClient;
};

export interface ITransactionManager {
  transaction: <T>(
    fn: (context: TransactionContext) => Promise<T>,
  ) => Promise<T>;
}
