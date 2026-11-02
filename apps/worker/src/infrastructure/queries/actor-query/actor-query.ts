import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";

import type { IActorQuery } from "../../../application/interfaces/queries/actor-query.js";

export class ActorQuery implements IActorQuery {
  async exists({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    const [row] = await ctx.db
      .select({ did: schema.actors.did })
      .from(schema.actors)
      .where(eq(schema.actors.did, did))
      .limit(1);
    return row !== undefined;
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
