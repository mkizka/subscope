import type { ITransactionManager } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { inArray } from "drizzle-orm";

export class Temp__CleanupDatabaseUseCase {
  constructor(private readonly transactionManager: ITransactionManager) {}
  static inject = ["transactionManager"] as const;

  async execute() {
    await this.transactionManager.transaction(async (ctx) => {
      const posts = await ctx.db
        .select({ uri: schema.posts.uri })
        .from(schema.posts);
      const uris = posts.map((post) => post.uri);
      await ctx.db
        .delete(schema.records)
        .where(inArray(schema.posts.uri, uris));
    });
  }
}
