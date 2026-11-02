import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { count, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import type { IAccountStatsQuery } from "../../../application/interfaces/queries/account-stats-query.js";

export class AccountStatsQuery implements IAccountStatsQuery {
  async countStats({
    ctx,
    accountDid,
  }: {
    ctx: TransactionContext;
    accountDid: string;
  }) {
    const countBy = async (table: PgTable, column: PgColumn) => {
      const [row] = await ctx.db
        .select({ count: count() })
        .from(table)
        .where(eq(column, accountDid));
      return row?.count ?? 0;
    };

    const [followsCount, followersCount, postsCount] = await Promise.all([
      countBy(schema.follows, schema.follows.accountDid),
      countBy(schema.follows, schema.follows.subjectDid),
      countBy(schema.posts, schema.posts.accountDid),
    ]);
    return { accountDid, followsCount, followersCount, postsCount };
  }
}
