import type { ITransactionManager } from "@dawn/common/domain";

export class Temp__CleanupDatabaseUseCase {
  constructor(private readonly transactionManager: ITransactionManager) {}
  static inject = ["transactionManager"] as const;

  async execute() {
    await this.transactionManager.transaction(async (ctx) => {
      await ctx.db.execute("TRUNCATE TABLE blobs;");
      await ctx.db.execute("TRUNCATE TABLE posts;");
      await ctx.db.execute("TRUNCATE TABLE profiles;");
      await ctx.db.execute("TRUNCATE TABLE records;");
      await ctx.db.execute("TRUNCATE TABLE actors;");
    });
  }
}
