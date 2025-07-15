import type { DatabaseClient } from "@repo/common/domain";
import { required } from "@repo/common/utils";
import { schema } from "@repo/db";
import { count, inArray, lt } from "drizzle-orm";

import type { JobLogger } from "../../../shared/job.js";

const DELETE_BATCH_SIZE = 1000;

const CLEANUP_THRESHOLD_DURATION = 1000 * 60 * 60 * 24;

export class Temp__CleanupDatabaseUseCase {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  private async getPostsCountToDelete(date: Date) {
    const [result] = await this.db
      .select({
        count: count(),
      })
      .from(schema.posts)
      .where(lt(schema.posts.indexedAt, date));
    return required(result).count;
  }

  private async getPostUrisToDelete(date: Date) {
    const posts = await this.db
      .select({ uri: schema.posts.uri })
      .from(schema.posts)
      .where(lt(schema.posts.indexedAt, date))
      .limit(DELETE_BATCH_SIZE);
    return posts.map((post) => post.uri);
  }

  private async deletePosts(uris: string[]) {
    await this.db
      .delete(schema.records)
      .where(inArray(schema.records.uri, uris));
  }

  async execute(jobLogger: JobLogger) {
    await jobLogger.log("Starting cleanup database");
    const oneDayAgo = new Date(Date.now() - CLEANUP_THRESHOLD_DURATION);
    const count = await this.getPostsCountToDelete(oneDayAgo);
    await jobLogger.log(`Found ${count} posts to delete`);

    const range = Math.ceil(count / DELETE_BATCH_SIZE);
    for (const i of Array(range).keys()) {
      const uris = await this.getPostUrisToDelete(oneDayAgo);
      await jobLogger.log(`Deleting ${uris.length} posts (${i + 1}/${range})`);
      await this.deletePosts(uris);
    }
  }
}
