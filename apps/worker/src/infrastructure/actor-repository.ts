import type { TransactionContext } from "@dawn/common/domain";
import type { Actor } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";

import type { IActorRepository } from "../application/interfaces/actor-repository.js";

export class ActorRepository implements IActorRepository {
  async create({ ctx, actor }: { ctx: TransactionContext; actor: Actor }) {
    await ctx.db
      .insert(schema.actors)
      .values({
        did: actor.did,
        handle: actor.handle,
      })
      .onConflictDoNothing();
  }

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
}
