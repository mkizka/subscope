import type {
  AfterCommitContext,
  DatabaseClient,
  ITransactionManager,
} from "@repo/common/domain";

export class TransactionManager implements ITransactionManager {
  constructor(private readonly db: DatabaseClient) {}

  async transaction<T>(
    fn: (ctx: AfterCommitContext) => Promise<T>,
  ): Promise<T> {
    const tasks: (() => Promise<void>)[] = [];
    const result = await this.db.transaction((tx) =>
      fn({ db: tx, afterCommit: (task) => tasks.push(task) }),
    );
    for (const task of tasks) await task();
    return result;
  }
}
