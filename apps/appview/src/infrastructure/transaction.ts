import type {
  ITransactionManager,
  TransactionContext,
} from "@dawn/common/domain";

import { db } from "./db.js";

export const defaultTransactionContext: TransactionContext = {
  db,
};

export class TransactionManager implements ITransactionManager {
  async transaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return await db.transaction((tx) => fn({ db: tx }));
  }
}
