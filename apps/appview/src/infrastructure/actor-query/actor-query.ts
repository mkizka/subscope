import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, asc, eq, gt } from "drizzle-orm";

import type { IActorQuery } from "../../application/interfaces/actor-query.js";

export class ActorQuery implements IActorQuery {
  constructor(private readonly db: DatabaseClient) {}

  async hasAnyAdmin(): Promise<boolean> {
    const rows = await this.db
      .select({ did: schema.actors.did })
      .from(schema.actors)
      .where(eq(schema.actors.isAdmin, true))
      .limit(1);
    return rows.length > 0;
  }

  async findBannedDids(params: {
    limit: number;
    cursor?: string;
  }): Promise<Did[]> {
    const rows = await this.db
      .select({ did: schema.actors.did })
      .from(schema.actors)
      .where(
        and(
          eq(schema.actors.isBanned, true),
          params.cursor ? gt(schema.actors.did, params.cursor) : undefined,
        ),
      )
      .orderBy(asc(schema.actors.did))
      .limit(params.limit);
    return rows.map((row) => asDid(row.did));
  }
}
