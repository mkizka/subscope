import type { DatabaseClient } from "@repo/common/domain";
import { required } from "@repo/common/utils";
import { schema } from "@repo/db";
import { inArray, sql } from "drizzle-orm";

import type {
  IPostStatsRepository,
  PostStats,
} from "../application/interfaces/post-stats-repository.js";

export class PostStatsRepository implements IPostStatsRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findStats(postUris: string[]): Promise<Map<string, PostStats>> {
    if (postUris.length === 0) {
      return new Map();
    }

    const [likeCounts, repostCounts, replyCounts] = await Promise.all([
      this.db
        .select({
          subjectUri: schema.likes.subjectUri,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.likes)
        .where(inArray(schema.likes.subjectUri, postUris))
        .groupBy(schema.likes.subjectUri),
      this.db
        .select({
          subjectUri: schema.reposts.subjectUri,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.reposts)
        .where(inArray(schema.reposts.subjectUri, postUris))
        .groupBy(schema.reposts.subjectUri),
      this.db
        .select({
          replyParentUri: schema.posts.replyParentUri,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.posts)
        .where(inArray(schema.posts.replyParentUri, postUris))
        .groupBy(schema.posts.replyParentUri),
    ]);

    const statsMap = new Map<string, PostStats>();

    for (const uri of postUris) {
      statsMap.set(uri, {
        likeCount: 0,
        repostCount: 0,
        replyCount: 0,
        quoteCount: 0,
      });
    }

    for (const like of likeCounts) {
      const stats = required(statsMap.get(like.subjectUri));
      stats.likeCount = like.count;
    }

    for (const repost of repostCounts) {
      const stats = required(statsMap.get(repost.subjectUri));
      stats.repostCount = repost.count;
    }

    for (const reply of replyCounts) {
      const postUri = required(reply.replyParentUri);
      const stats = required(statsMap.get(postUri));
      stats.replyCount = reply.count;
    }

    return statsMap;
  }
}
