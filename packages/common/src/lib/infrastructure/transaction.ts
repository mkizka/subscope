import type {
  DatabaseClient,
  ITransactionManager,
  TransactionContext,
} from "@dawn/common/domain";

export class TransactionManager implements ITransactionManager {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async transaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return await this.db.transaction((tx) => fn({ db: tx }));
  }
}
