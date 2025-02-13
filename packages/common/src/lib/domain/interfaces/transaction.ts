import type { schema } from "@dawn/db";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type DatabaseClient = NodePgDatabase<typeof schema>;

export type TransactionContext = {
  db: DatabaseClient;
};

export interface ITransactionManager {
  transaction: <T>(
    fn: (context: TransactionContext) => Promise<T>,
  ) => Promise<T>;
}
