import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { count, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import type { IActorStatsQuery } from "../../../application/interfaces/queries/actor-stats-query.js";

export class ActorStatsQuery implements IActorStatsQuery {
  async countStats({
    ctx,
    actorDid,
  }: {
    ctx: TransactionContext;
    actorDid: string;
  }) {
    const countBy = async (table: PgTable, column: PgColumn) => {
      const [row] = await ctx.db
        .select({ count: count() })
        .from(table)
        .where(eq(column, actorDid));
      return row?.count ?? 0;
    };

    const [followsCount, followersCount, postsCount] = await Promise.all([
      countBy(schema.follows, schema.follows.actorDid),
      countBy(schema.follows, schema.follows.subjectDid),
      countBy(schema.posts, schema.posts.actorDid),
    ]);
    return { actorDid, followsCount, followersCount, postsCount };
  }
}
