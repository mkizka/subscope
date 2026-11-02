import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type { ActorStatsDto } from "../../../application/dto/actor-stats-dto.js";
import type { IActorStatsQuery } from "../../../application/interfaces/queries/actor-stats-query.js";

export class ActorStatsQuery implements IActorStatsQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findStats(actorDids: Did[]): Promise<ActorStatsDto[]> {
    if (actorDids.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(schema.actorStats)
      .where(inArray(schema.actorStats.actorDid, actorDids));
    return rows.map((row) => ({
      actorDid: asDid(row.actorDid),
      followsCount: row.followsCount,
      followersCount: row.followersCount,
      postsCount: row.postsCount,
    }));
  }
}
