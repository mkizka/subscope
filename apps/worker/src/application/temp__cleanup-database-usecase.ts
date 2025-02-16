import type { DatabaseClient } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { count, inArray, lt } from "drizzle-orm";

export class Temp__CleanupDatabaseUseCase {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async execute(jobLogger: { log: (message: string) => void }) {
    jobLogger.log("Starting cleanup database");
    const ONE_HOUR_AGO = new Date(Date.now() - 1000 * 60 * 60);
    const [postCountsToDelete] = await this.db
      .select({
        count: count(),
      })
      .from(schema.posts)
      .where(lt(schema.posts.createdAt, ONE_HOUR_AGO));

    jobLogger.log(`Found ${postCountsToDelete!.count} posts to delete`);
    const range = Math.ceil(postCountsToDelete!.count / 100);
    for (const i of Array(range).keys()) {
      const posts = await this.db
        .select({ uri: schema.posts.uri })
        .from(schema.posts)
        .where(lt(schema.posts.createdAt, ONE_HOUR_AGO))
        .limit(100);
      jobLogger.log(`Deleting ${posts.length} posts (${i + 1}/${range})`);
      const uris = posts.map((post) => post.uri);
      await this.db
        .delete(schema.records)
        .where(inArray(schema.records.uri, uris));
    }
  }
}
