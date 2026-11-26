import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { and, count, eq, inArray, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import type { IPostStatsQuery } from "../../../application/interfaces/queries/post-stats-query.js";

export class PostStatsQuery implements IPostStatsQuery {
  async countStats({ ctx, uris }: { ctx: TransactionContext; uris: string[] }) {
    const countBy = async (
      table: PgTable,
      { column, where }: { column: PgColumn; where?: SQL },
    ) => {
      const rows = await ctx.db
        .select({ uri: column, count: count() })
        .from(table)
        .where(and(inArray(column, uris), where))
        .groupBy(column);
      return new Map(rows.map((row) => [row.uri, row.count]));
    };

    const [posts, likes, reposts, replies, quotes] = await Promise.all([
      ctx.db
        .select({ uri: schema.posts.uri })
        .from(schema.posts)
        .where(inArray(schema.posts.uri, uris)),
      countBy(schema.likes, { column: schema.likes.subjectUri }),
      countBy(schema.reposts, { column: schema.reposts.subjectUri }),
      countBy(schema.posts, {
        column: schema.posts.replyParentUri,
        where: eq(schema.posts.violatesThreadgate, false),
      }),
      countBy(schema.postEmbedRecords, { column: schema.postEmbedRecords.uri }),
    ]);
    return posts.map(({ uri }) => ({
      postUri: uri,
      likeCount: likes.get(uri) ?? 0,
      repostCount: reposts.get(uri) ?? 0,
      replyCount: replies.get(uri) ?? 0,
      quoteCount: quotes.get(uri) ?? 0,
    }));
  }
}
