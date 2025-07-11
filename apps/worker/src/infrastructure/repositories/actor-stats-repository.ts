import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { count, eq } from "drizzle-orm";

import type { IActorStatsRepository } from "../../application/interfaces/repositories/actor-stats-repository.js";

export class ActorStatsRepository implements IActorStatsRepository {
  async upsertFollowsCount({
    ctx,
    actorDid,
  }: {
    ctx: TransactionContext;
    actorDid: string;
  }) {
    const [result] = await ctx.db
      .select({ count: count() })
      .from(schema.follows)
      .where(eq(schema.follows.actorDid, actorDid));

    const followsCount = result?.count ?? 0;
    await ctx.db
      .insert(schema.actorStats)
      .values({
        actorDid,
        followsCount,
        followersCount: 0,
        postsCount: 0,
      })
      .onConflictDoUpdate({
        target: schema.actorStats.actorDid,
        set: {
          followsCount,
        },
      });
  }

  async upsertFollowersCount({
    ctx,
    actorDid,
  }: {
    ctx: TransactionContext;
    actorDid: string;
  }) {
    const [result] = await ctx.db
      .select({ count: count() })
      .from(schema.follows)
      .where(eq(schema.follows.subjectDid, actorDid));

    const followersCount = result?.count ?? 0;
    await ctx.db
      .insert(schema.actorStats)
      .values({
        actorDid,
        followsCount: 0,
        followersCount,
        postsCount: 0,
      })
      .onConflictDoUpdate({
        target: schema.actorStats.actorDid,
        set: {
          followersCount,
        },
      });
  }

  async upsertPostsCount({
    ctx,
    actorDid,
  }: {
    ctx: TransactionContext;
    actorDid: string;
  }) {
    const [result] = await ctx.db
      .select({ count: count() })
      .from(schema.posts)
      .where(eq(schema.posts.actorDid, actorDid));

    const postsCount = result?.count ?? 0;
    await ctx.db
      .insert(schema.actorStats)
      .values({
        actorDid,
        followsCount: 0,
        followersCount: 0,
        postsCount,
      })
      .onConflictDoUpdate({
        target: schema.actorStats.actorDid,
        set: {
          postsCount,
        },
      });
  }
}
