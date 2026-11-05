import type {
  AfterCommitContext,
  ITransactionManager,
  TransactionContext,
} from "../../interface/transaction.js";

export class InMemoryTransactionManager implements ITransactionManager {
  async transaction<T>(
    fn: (ctx: AfterCommitContext) => Promise<T>,
  ): Promise<T> {
    const tasks: (() => Promise<void>)[] = [];
    const result = await fn({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      db: {} as TransactionContext["db"],
      afterCommit: (task) => tasks.push(task),
    });
    for (const task of tasks) await task();
    return result;
  }
}
