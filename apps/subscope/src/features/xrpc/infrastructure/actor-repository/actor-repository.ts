import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import {
  Actor,
  type DatabaseClient,
  type TransactionContext,
} from "@repo/common/domain";
import { type ActorInsert, schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IActorRepository } from "../../application/interfaces/actor-repository.js";

export class ActorRepository implements IActorRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async upsert({ ctx, actor }: { ctx: TransactionContext; actor: Actor }) {
    const data = {
      handle: actor.handle,
    } satisfies ActorInsert;
    await ctx.db
      .insert(schema.actors)
      .values({
        did: actor.did,
        indexedAt: actor.indexedAt,
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.actors.did,
        set: data,
      });
  }

  async findByDid(did: Did): Promise<Actor | null> {
    const [row] = await this.db
      .select({
        did: schema.actors.did,
        handle: schema.actors.handle,
        isAdmin: schema.actors.isAdmin,
        indexedAt: schema.actors.indexedAt,
      })
      .from(schema.actors)
      .where(eq(schema.actors.did, did))
      .limit(1);

    if (!row) {
      return null;
    }

    return Actor.reconstruct({
      did: asDid(row.did),
      handle: row.handle,
      isAdmin: row.isAdmin,
      indexedAt: row.indexedAt,
    });
  }

  async hasAnyAdmin(): Promise<boolean> {
    const rows = await this.db
      .select({ did: schema.actors.did })
      .from(schema.actors)
      .where(eq(schema.actors.isAdmin, true))
      .limit(1);
    return rows.length > 0;
  }
}
