import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { sql } from "drizzle-orm";

import type {
  IPostStatsRepository,
  PostStats,
} from "../../../application/interfaces/repositories/post-stats-repository.js";

export class PostStatsRepository implements IPostStatsRepository {
  async save({ ctx, stats }: { ctx: TransactionContext; stats: PostStats[] }) {
    if (stats.length === 0) return;
    await ctx.db
      .insert(schema.postStats)
      .values(stats)
      .onConflictDoUpdate({
        target: schema.postStats.postUri,
        set: {
          likeCount: sql`excluded.like_count`,
          repostCount: sql`excluded.repost_count`,
          replyCount: sql`excluded.reply_count`,
          quoteCount: sql`excluded.quote_count`,
        },
      });
  }
}
