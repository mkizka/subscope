import type { Did } from "@atproto/did";
import { Actor, type DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IActorRepository } from "../application/interfaces/actor-repository.js";

export class ActorRepository implements IActorRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findByDid(did: Did): Promise<Actor | null> {
    const [row] = await this.db
      .select({
        did: schema.actors.did,
        handle: schema.actors.handle,
        backfillStatus: schema.actors.backfillStatus,
        backfillVersion: schema.actors.backfillVersion,
        indexedAt: schema.actors.indexedAt,
      })
      .from(schema.actors)
      .where(eq(schema.actors.did, did))
      .limit(1);

    if (!row) {
      return null;
    }

    return new Actor({
      did: row.did,
      handle: row.handle,
      backfillStatus: row.backfillStatus,
      backfillVersion: row.backfillVersion,
      indexedAt: row.indexedAt,
    });
  }
}
