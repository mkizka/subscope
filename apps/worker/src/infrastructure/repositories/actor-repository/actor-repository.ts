import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import type { Actor } from "@repo/common/domain";
import { Actor as ActorDomain } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq, sql } from "drizzle-orm";

import type { IActorRepository } from "../../../application/interfaces/repositories/actor-repository.js";

export class ActorRepository implements IActorRepository {
  async upsert({ ctx, actor }: { ctx: TransactionContext; actor: Actor }) {
    await ctx.db
      .insert(schema.actors)
      .values({
        did: actor.did,
        handle: actor.handle,
        isAdmin: actor.isAdmin,
        indexedAt: actor.indexedAt,
      })
      .onConflictDoUpdate({
        target: schema.actors.did,
        set: {
          handle: sql`coalesce(excluded.handle, ${schema.actors.handle})`,
        },
      });
  }

  async findByDid({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    const [row] = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, did))
      .limit(1);
    if (!row) {
      return null;
    }
    return ActorDomain.reconstruct({
      did: asDid(row.did),
      handle: row.handle || null,
      isAdmin: row.isAdmin,
      indexedAt: row.indexedAt,
    });
  }

  async exists({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    const actor = await this.findByDid({ ctx, did });
    return actor !== null;
  }

  async delete({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    await ctx.db.delete(schema.actors).where(eq(schema.actors.did, did));
  }
}
