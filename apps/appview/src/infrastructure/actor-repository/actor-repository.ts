import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import {
  Actor,
  type DatabaseClient,
  type TransactionContext,
} from "@repo/common/domain";
import { type ActorInsert, schema } from "@repo/db";
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";

import type {
  BackfillStatus,
  IActorRepository,
} from "../../application/interfaces/actor-repository.js";

export class ActorRepository implements IActorRepository {
  constructor(private readonly db: DatabaseClient) {}

  async upsert({ ctx, actor }: { ctx: TransactionContext; actor: Actor }) {
    const data = {
      handle: actor.handle,
      isAdmin: actor.isAdmin,
      isBanned: actor.isBanned,
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

  async findByDid(did: Did): Promise<Actor | null> {
    const [row] = await this.db
      .select({
        did: schema.actors.did,
        handle: schema.actors.handle,
        isAdmin: schema.actors.isAdmin,
        isBanned: schema.actors.isBanned,
        indexedAt: schema.actors.indexedAt,
      })
      .from(schema.actors)
      .where(eq(schema.actors.did, did))
      .limit(1);

    if (!row) {
      return null;
    }

    return Actor.reconstruct({
      did: asDid(row.did),
      handle: row.handle,
      isAdmin: row.isAdmin,
      isBanned: row.isBanned,
      indexedAt: row.indexedAt,
    });
  }

  async hasAnyAdmin(): Promise<boolean> {
    const rows = await this.db
      .select({ did: schema.actors.did })
      .from(schema.actors)
      .where(eq(schema.actors.isAdmin, true))
      .limit(1);
    return rows.length > 0;
  }

  async findBannedDids(params: {
    limit: number;
    cursor?: string;
  }): Promise<Did[]> {
    const rows = await this.db
      .select({ did: schema.actors.did })
      .from(schema.actors)
      .where(
        and(
          eq(schema.actors.isBanned, true),
          params.cursor ? gt(schema.actors.did, params.cursor) : undefined,
        ),
      )
      .orderBy(asc(schema.actors.did))
      .limit(params.limit);
    return rows.map((row) => asDid(row.did));
  }

  async findBackfillStatusesWithFollows(
    dids: Did[],
  ): Promise<Map<Did, BackfillStatus>> {
    if (dids.length === 0) {
      return new Map();
    }
    const targets = this.db
      .select({ ownerDid: schema.actors.did, targetDid: schema.actors.did })
      .from(schema.actors)
      .where(inArray(schema.actors.did, dids))
      .unionAll(
        this.db
          .select({
            ownerDid: schema.follows.actorDid,
            targetDid: schema.follows.subjectDid,
          })
          .from(schema.follows)
          .where(inArray(schema.follows.actorDid, dids)),
      )
      .as("targets");
    const rows = await this.db
      .select({
        ownerDid: targets.ownerDid,
        hasError: sql<boolean>`bool_or(${schema.actors.backfillStatus} = 'error')`,
        allCompleted: sql<boolean>`bool_and(coalesce(${schema.actors.backfillStatus} = 'completed', false))`,
      })
      .from(targets)
      .innerJoin(schema.actors, eq(schema.actors.did, targets.targetDid))
      .groupBy(targets.ownerDid);
    return new Map<Did, BackfillStatus>(
      rows.map((row) => [
        asDid(row.ownerDid),
        row.hasError ? "error" : row.allCompleted ? "completed" : "inProgress",
      ]),
    );
  }
}
