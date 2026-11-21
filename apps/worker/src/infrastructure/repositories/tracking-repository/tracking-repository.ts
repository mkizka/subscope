import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { ITrackingRepository } from "../../../application/interfaces/repositories/tracking-repository.js";
import { Tracking } from "../../../domain/tracking.js";

export class TrackingRepository implements ITrackingRepository {
  async save({
    ctx,
    tracking,
  }: {
    ctx: TransactionContext;
    tracking: Tracking;
  }) {
    await ctx.db
      .insert(schema.trackings)
      .values({ accountDid: tracking.did, trackedAt: tracking.trackedAt })
      .onConflictDoUpdate({
        target: schema.trackings.accountDid,
        set: { trackedAt: tracking.trackedAt },
      });
  }

  async find({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    const [row] = await ctx.db
      .select()
      .from(schema.trackings)
      .where(eq(schema.trackings.accountDid, did))
      .limit(1);
    if (!row) {
      return null;
    }
    return Tracking.reconstruct({
      did: row.accountDid,
      trackedAt: row.trackedAt,
    });
  }

  async delete({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    await ctx.db
      .delete(schema.trackings)
      .where(eq(schema.trackings.accountDid, did));
  }
}
