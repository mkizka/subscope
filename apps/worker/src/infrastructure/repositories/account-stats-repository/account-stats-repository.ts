import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";

import type {
  AccountStats,
  IAccountStatsRepository,
} from "../../../application/interfaces/repositories/account-stats-repository.js";

export class AccountStatsRepository implements IAccountStatsRepository {
  async save({ ctx, stats }: { ctx: TransactionContext; stats: AccountStats }) {
    await ctx.db
      .insert(schema.accountStats)
      .values(stats)
      .onConflictDoUpdate({
        target: schema.accountStats.accountDid,
        set: {
          followsCount: stats.followsCount,
          followersCount: stats.followersCount,
          postsCount: stats.postsCount,
        },
      });
  }
}
