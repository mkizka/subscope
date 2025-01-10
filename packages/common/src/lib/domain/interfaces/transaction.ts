import type { DatabaseClient, TransactionClient } from "@dawn/db";

export type TransactionContext = {
  db: DatabaseClient | TransactionClient;
};

export interface ITransactionManager {
  transaction: <T>(
    fn: (context: TransactionContext) => Promise<T>,
  ) => Promise<T>;
}
