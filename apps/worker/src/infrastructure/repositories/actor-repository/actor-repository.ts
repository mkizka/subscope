import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import type { Actor } from "@repo/common/domain";
import { Actor as ActorDomain } from "@repo/common/domain";
import { type ActorInsert, schema } from "@repo/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";

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

  async exists({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    const actor = await this.find({ ctx, did });
    return actor !== null;
  }

  async delete({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    await ctx.db.delete(schema.actors).where(eq(schema.actors.did, did));
  }

  async findTrackedDidsWithoutBackfillStatus(ctx: TransactionContext) {
    const trackedDids = union(
      ctx.db
        .select({ did: schema.subscriptions.actorDid })
        .from(schema.subscriptions),
      ctx.db
        .select({ did: schema.follows.subjectDid })
        .from(schema.follows)
        .innerJoin(
          schema.subscriptions,
          eq(schema.follows.actorDid, schema.subscriptions.actorDid),
        ),
    );
    const rows = await ctx.db
      .select({ did: schema.actors.did })
      .from(schema.actors)
      .where(
        and(
          isNull(schema.actors.backfillStatus),
          inArray(schema.actors.did, trackedDids),
        ),
      );
    return rows.map((row) => asDid(row.did));
  }
}
