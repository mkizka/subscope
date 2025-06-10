import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import type { Actor, BackfillStatus } from "@repo/common/domain";
import { Actor as ActorDomain } from "@repo/common/domain";
import type { Handle } from "@repo/common/utils";
import { type ActorInsert, schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IActorRepository } from "../application/interfaces/repositories/actor-repository.js";

const CURRENT_BACKFILL_VERSION = 1;

export class ActorRepository implements IActorRepository {
  async upsert({ ctx, actor }: { ctx: TransactionContext; actor: Actor }) {
    const data = {
      handle: actor.handle,
      backfillStatus: actor.backfillStatus,
      backfillVersion: actor.backfillVersion,
    } satisfies ActorInsert;
    await ctx.db
      .insert(schema.actors)
      .values({
        did: actor.did,
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.actors.did,
        set: data,
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
    return new ActorDomain({
      did: asDid(row.did),
      handle: row.handle || undefined,
      backfillStatus: row.backfillStatus,
      backfillVersion: row.backfillVersion,
    });
  }

  async updateBackfillStatus({
    ctx,
    did,
    status,
  }: {
    ctx: TransactionContext;
    did: Did;
    status: BackfillStatus;
  }) {
    await ctx.db
      .update(schema.actors)
      .set({
        backfillStatus: status,
        backfillVersion: CURRENT_BACKFILL_VERSION,
      })
      .where(eq(schema.actors.did, did));
  }

  async updateHandle({
    ctx,
    did,
    handle,
  }: {
    ctx: TransactionContext;
    did: Did;
    handle: Handle;
  }) {
    await ctx.db
      .update(schema.actors)
      .set({
        handle,
      })
      .where(eq(schema.actors.did, did));
  }
}
