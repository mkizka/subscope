import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import type { Actor } from "@repo/common/domain";
import { Actor as ActorDomain } from "@repo/common/domain";
import { type ActorInsert, schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IActorRepository } from "../../../application/interfaces/repositories/actor-repository.js";

export class ActorRepository implements IActorRepository {
  async save({ ctx, actor }: { ctx: TransactionContext; actor: Actor }) {
    const data = {
      handle: actor.handle,
      status: actor.status,
      backfillStatus: actor.backfillStatus,
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

  async find({ ctx, did }: { ctx: TransactionContext; did: Did }) {
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
      isBanned: row.isBanned,
      status: row.status,
      backfillStatus: row.backfillStatus,
      indexedAt: row.indexedAt,
    });
  }

  async delete({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    await ctx.db.delete(schema.actors).where(eq(schema.actors.did, did));
  }
}
