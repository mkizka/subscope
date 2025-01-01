import type { Prisma } from "@dawn/db";

export type TransactionContext = {
  prisma: Prisma.TransactionClient;
};

export interface ITransactionManager {
  transaction: <T>(
    fn: (context: TransactionContext) => Promise<T>,
  ) => Promise<T>;
}
