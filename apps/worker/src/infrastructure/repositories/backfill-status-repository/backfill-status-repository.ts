import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";

import type {
  BackfillStatus,
  IBackfillStatusRepository,
} from "../../../application/interfaces/repositories/backfill-status-repository.js";

export class BackfillStatusRepository implements IBackfillStatusRepository {
  async save({
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
      .set({ backfillStatus: status })
      .where(eq(schema.actors.did, did));
  }

  async findUncheckedTrackedDids(ctx: TransactionContext) {
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
