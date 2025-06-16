import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { count, eq } from "drizzle-orm";

import type { IPostStatsRepository } from "../application/interfaces/repositories/post-stats-repository.js";

export class PostStatsRepository implements IPostStatsRepository {
  async upsertLikeCount({
    ctx,
    postUri,
  }: {
    ctx: TransactionContext;
    postUri: string;
  }) {
    const [result] = await ctx.db
      .select({ count: count() })
      .from(schema.likes)
      .where(eq(schema.likes.subjectUri, postUri));

    const likeCount = result?.count ?? 0;
    await ctx.db
      .insert(schema.postStats)
      .values({
        postUri,
        likeCount,
      })
      .onConflictDoUpdate({
        target: schema.postStats.postUri,
        set: {
          likeCount,
        },
      });
  }

  async upsertRepostCount({
    ctx,
    postUri,
  }: {
    ctx: TransactionContext;
    postUri: string;
  }) {
    const [result] = await ctx.db
      .select({ count: count() })
      .from(schema.reposts)
      .where(eq(schema.reposts.subjectUri, postUri));

    const repostCount = result?.count ?? 0;
    await ctx.db
      .insert(schema.postStats)
      .values({
        postUri,
        repostCount,
      })
      .onConflictDoUpdate({
        target: schema.postStats.postUri,
        set: {
          repostCount,
        },
      });
  }
}
