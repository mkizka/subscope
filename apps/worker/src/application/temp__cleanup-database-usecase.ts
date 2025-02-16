import type { DatabaseClient } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { inArray } from "drizzle-orm";

const chunk = <T>(array: T[], n: number): T[][] => {
  const newArrayLength = Math.ceil(array.length / n);
  return Array.from({ length: newArrayLength }, (_, i) =>
    array.slice(i * n, i * n + n),
  );
};

export class Temp__CleanupDatabaseUseCase {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async execute(jobLogger: { log: (message: string) => void }) {
    const allPosts = await this.db
      .select({ uri: schema.posts.uri })
      .from(schema.posts);
    jobLogger.log(`Found ${allPosts.length} posts`);
    const splittedPosts = chunk(allPosts, 100);
    for (const [i, postChunk] of splittedPosts.entries()) {
      jobLogger.log(`Deleting posts (${i + 1}/${splittedPosts.length})`);
      const uris = postChunk.map((post) => post.uri);
      await this.db
        .delete(schema.records)
        .where(inArray(schema.posts.uri, uris));
    }
  }
}
