import type {
  ITransactionManager,
  TransactionContext,
} from "../../domain/interfaces/transaction.js";

export class InMemoryTransactionManager implements ITransactionManager {
  async transaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return await fn({ db: {} as TransactionContext["db"] });
  }
}
