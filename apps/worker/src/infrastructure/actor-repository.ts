import type { TransactionContext } from "@dawn/common/domain";
import type { Actor } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";

import type { IActorRepository } from "../application/interfaces/actor-repository.js";

export class ActorRepository implements IActorRepository {
  async exists({ ctx, did }: { ctx: TransactionContext; did: string }) {
    const rows = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, did))
      .limit(1);
    return rows.length > 0;
  }

  async upsert({ ctx, actor }: { ctx: TransactionContext; actor: Actor }) {
    await ctx.db
      .insert(schema.actors)
      .values({
        did: actor.did,
        handle: actor.handle,
      })
      .onDuplicateKeyUpdate({
        set: {
          handle: actor.handle,
        },
      });
  }
}
