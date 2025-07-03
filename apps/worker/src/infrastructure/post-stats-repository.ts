import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { count, eq } from "drizzle-orm";

import type { IPostStatsRepository } from "../application/interfaces/repositories/post-stats-repository.js";

export class PostStatsRepository implements IPostStatsRepository {
  async upsertLikeCount({ ctx, uri }: { ctx: TransactionContext; uri: AtUri }) {
    const postUri = uri.toString();
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
        repostCount: 0,
        replyCount: 0,
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
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }) {
    const postUri = uri.toString();
    const [result] = await ctx.db
      .select({ count: count() })
      .from(schema.reposts)
      .where(eq(schema.reposts.subjectUri, postUri));

    const repostCount = result?.count ?? 0;
    await ctx.db
      .insert(schema.postStats)
      .values({
        postUri,
        likeCount: 0,
        repostCount,
        replyCount: 0,
      })
      .onConflictDoUpdate({
        target: schema.postStats.postUri,
        set: {
          repostCount,
        },
      });
  }

  async upsertReplyCount({
    ctx,
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }) {
    const postUri = uri.toString();
    const [result] = await ctx.db
      .select({ count: count() })
      .from(schema.posts)
      .where(eq(schema.posts.replyParentUri, postUri));

    const replyCount = result?.count ?? 0;
    await ctx.db
      .insert(schema.postStats)
      .values({
        postUri,
        likeCount: 0,
        repostCount: 0,
        replyCount,
      })
      .onConflictDoUpdate({
        target: schema.postStats.postUri,
        set: {
          replyCount,
        },
      });
  }

  async upsertAllCount({ ctx, uri }: { ctx: TransactionContext; uri: AtUri }) {
    const postUri = uri.toString();

    const [[likeResult], [repostResult], [replyResult]] = await Promise.all([
      ctx.db
        .select({ count: count() })
        .from(schema.likes)
        .where(eq(schema.likes.subjectUri, postUri)),
      ctx.db
        .select({ count: count() })
        .from(schema.reposts)
        .where(eq(schema.reposts.subjectUri, postUri)),
      ctx.db
        .select({ count: count() })
        .from(schema.posts)
        .where(eq(schema.posts.replyParentUri, postUri)),
    ]);

    const likeCount = likeResult?.count ?? 0;
    const repostCount = repostResult?.count ?? 0;
    const replyCount = replyResult?.count ?? 0;

    await ctx.db
      .insert(schema.postStats)
      .values({
        postUri,
        likeCount,
        repostCount,
        replyCount,
      })
      .onConflictDoUpdate({
        target: schema.postStats.postUri,
        set: {
          likeCount,
          repostCount,
          replyCount,
        },
      });
  }
}
