import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type {
  ActorStats,
  IActorStatsRepository,
} from "../../application/interfaces/actor-stats-repository.js";

export class ActorStatsRepository implements IActorStatsRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findStats(actorDids: string[]): Promise<Map<string, ActorStats>> {
    if (actorDids.length === 0) {
      return new Map();
    }

    const actorStats = await this.db
      .select()
      .from(schema.actorStats)
      .where(inArray(schema.actorStats.actorDid, actorDids));

    const statsMap = new Map<string, ActorStats>();

    for (const did of actorDids) {
      statsMap.set(did, {
        followsCount: 0,
        followersCount: 0,
        postsCount: 0,
      });
    }

    for (const stats of actorStats) {
      statsMap.set(stats.actorDid, {
        followsCount: stats.followsCount,
        followersCount: stats.followersCount,
        postsCount: stats.postsCount,
      });
    }

    return statsMap;
  }
}
