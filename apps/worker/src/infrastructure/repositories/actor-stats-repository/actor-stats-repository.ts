import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type {
  ActorStats,
  IActorStatsRepository,
} from "../../../application/interfaces/repositories/actor-stats-repository.js";

export class ActorStatsRepository implements IActorStatsRepository {
  async save({ ctx, stats }: { ctx: TransactionContext; stats: ActorStats }) {
    await ctx.db
      .insert(schema.actorStats)
      .values(stats)
      .onConflictDoUpdate({
        target: schema.actorStats.actorDid,
        set: {
          followsCount: stats.followsCount,
          followersCount: stats.followersCount,
          postsCount: stats.postsCount,
        },
      });
  }
}
