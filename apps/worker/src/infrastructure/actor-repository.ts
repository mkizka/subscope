import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@dawn/common/domain";
import type { Actor } from "@dawn/common/domain";
import { Actor as ActorDomain } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";

import type { IActorRepository } from "../application/interfaces/actor-repository.js";

export class ActorRepository implements IActorRepository {
  async upsert({ ctx, actor }: { ctx: TransactionContext; actor: Actor }) {
    await ctx.db
      .insert(schema.actors)
      .values({
        did: actor.did,
        handle: actor.handle,
      })
      .onConflictDoUpdate({
        target: schema.actors.did,
        set: { handle: actor.handle },
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
    });
  }
}
