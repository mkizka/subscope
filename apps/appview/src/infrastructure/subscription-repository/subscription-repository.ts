import { asDid, type Did } from "@atproto/did";
import {
  type DatabaseClient,
  Subscription,
  type TransactionContext,
} from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  lt,
  or,
} from "drizzle-orm";

import type { ISubscriptionRepository } from "../../application/interfaces/subscription-repository.js";

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findMany(params: {
    limit: number;
    cursor?: string;
  }): Promise<Subscription[]> {
    const filters = [];

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      filters.push(lt(schema.subscriptions.createdAt, cursorDate));
    }

    const rows = await this.db.query.subscriptions.findMany({
      where: filters.length > 0 ? filters[0] : undefined,
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
      limit: params.limit,
    });

    return rows.map(
      (row) =>
        new Subscription({
          actorDid: row.actorDid,
          inviteCode: row.inviteCode,
          seenAt: row.seenAt,
          createdAt: row.createdAt,
        }),
    );
  }

  async findTrackedActors(params: {
    limit: number;
    cursor?: string;
  }): Promise<{ did: Did; subscriberFollowersCount: number }[]> {
    const { actors, follows, subscriptions } = schema;
    const subscriberFollowersCount = countDistinct(subscriptions.actorDid);
    const cursor = params.cursor?.split("::");

    const rows = await this.db
      .select({ did: actors.did, subscriberFollowersCount })
      .from(actors)
      .leftJoin(follows, eq(follows.subjectDid, actors.did))
      .leftJoin(subscriptions, eq(subscriptions.actorDid, follows.actorDid))
      .where(
        or(
          isNotNull(subscriptions.actorDid),
          inArray(
            actors.did,
            this.db.select({ did: subscriptions.actorDid }).from(subscriptions),
          ),
        ),
      )
      .groupBy(actors.did)
      .having(
        cursor
          ? or(
              lt(subscriberFollowersCount, Number(cursor[0])),
              and(
                eq(subscriberFollowersCount, Number(cursor[0])),
                gt(actors.did, cursor[1] ?? ""),
              ),
            )
          : undefined,
      )
      .orderBy(desc(subscriberFollowersCount), asc(actors.did))
      .limit(params.limit);

    return rows.map((row) => ({ ...row, did: asDid(row.did) }));
  }

  async findFirst(actorDid: Did): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.actorDid, actorDid))
      .limit(1);

    if (!row) {
      return null;
    }

    return new Subscription({
      actorDid: row.actorDid,
      inviteCode: row.inviteCode,
      seenAt: row.seenAt,
      createdAt: row.createdAt,
    });
  }

  async existsByInviteCode(inviteCode: string): Promise<boolean> {
    const [row] = await this.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.inviteCode, inviteCode))
      .limit(1);

    return !!row;
  }

  async save({
    subscription,
    ctx,
  }: {
    subscription: Subscription;
    ctx: TransactionContext;
  }): Promise<void> {
    await ctx.db
      .insert(schema.subscriptions)
      .values({
        actorDid: subscription.actorDid,
        inviteCode: subscription.inviteCode,
        createdAt: subscription.createdAt,
      })
      .onConflictDoUpdate({
        target: schema.subscriptions.actorDid,
        set: {
          inviteCode: subscription.inviteCode,
          createdAt: subscription.createdAt,
        },
      });
  }

  async updateSeenAt(actorDid: Did, seenAt: Date): Promise<void> {
    await this.db
      .update(schema.subscriptions)
      .set({ seenAt })
      .where(eq(schema.subscriptions.actorDid, actorDid));
  }

  async delete(actorDid: Did): Promise<void> {
    await this.db
      .delete(schema.subscriptions)
      .where(eq(schema.subscriptions.actorDid, actorDid));
  }
}
