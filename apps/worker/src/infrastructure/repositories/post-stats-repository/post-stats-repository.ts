import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { count, inArray, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import type { IPostStatsRepository } from "../../../application/interfaces/repositories/post-stats-repository.js";

export class PostStatsRepository implements IPostStatsRepository {
  async upsertMany({ ctx, uris }: { ctx: TransactionContext; uris: string[] }) {
    const countBy = async (table: PgTable, column: PgColumn) => {
      const rows = await ctx.db
        .select({ uri: column, count: count() })
        .from(table)
        .where(inArray(column, uris))
        .groupBy(column);
      return new Map(rows.map((row) => [row.uri, row.count]));
    };

    const [posts, likes, reposts, replies, quotes] = await Promise.all([
      ctx.db
        .select({ uri: schema.posts.uri })
        .from(schema.posts)
        .where(inArray(schema.posts.uri, uris)),
      countBy(schema.likes, schema.likes.subjectUri),
      countBy(schema.reposts, schema.reposts.subjectUri),
      countBy(schema.posts, schema.posts.replyParentUri),
      countBy(schema.postEmbedRecords, schema.postEmbedRecords.uri),
    ]);
    if (posts.length === 0) return;

    await ctx.db
      .insert(schema.postStats)
      .values(
        posts.map(({ uri }) => ({
          postUri: uri,
          likeCount: likes.get(uri) ?? 0,
          repostCount: reposts.get(uri) ?? 0,
          replyCount: replies.get(uri) ?? 0,
          quoteCount: quotes.get(uri) ?? 0,
        })),
      )
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
