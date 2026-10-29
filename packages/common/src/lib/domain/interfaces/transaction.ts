import type { schema } from "@repo/db";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type DatabaseClient = NodePgDatabase<typeof schema>;

export type TransactionContext = {
  db: DatabaseClient;
};

export type AfterCommitContext = TransactionContext & {
  afterCommit: (task: () => Promise<void>) => void;
};

export interface ITransactionManager {
  transaction: <T>(
    fn: (context: AfterCommitContext) => Promise<T>,
  ) => Promise<T>;
}
