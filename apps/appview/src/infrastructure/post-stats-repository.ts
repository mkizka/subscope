import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type {
  IPostStatsRepository,
  PostStats,
} from "../application/interfaces/post-stats-repository.js";

export class PostStatsRepository implements IPostStatsRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findByUris(postUris: string[]): Promise<Map<string, PostStats>> {
    if (postUris.length === 0) {
      return new Map();
    }

    const postStats = await this.db
      .select()
      .from(schema.postStats)
      .where(inArray(schema.postStats.postUri, postUris));

    const statsMap = new Map<string, PostStats>();

    for (const uri of postUris) {
      statsMap.set(uri, {
        likeCount: 0,
        repostCount: 0,
        replyCount: 0,
        quoteCount: 0,
      });
    }

    for (const stats of postStats) {
      statsMap.set(stats.postUri, {
        likeCount: stats.likeCount,
        repostCount: stats.repostCount,
        replyCount: stats.replyCount,
        quoteCount: stats.quoteCount,
      });
    }

    return statsMap;
  }
}
