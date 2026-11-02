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
  count,
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

  async count(): Promise<number> {
    const [row] = await this.db
      .select({ count: count() })
      .from(schema.subscriptions);
    return row?.count ?? 0;
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
      .where(this.isTrackedActor())
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

  async countTrackedActors(): Promise<number> {
    const { actors, follows, subscriptions } = schema;
    const [row] = await this.db
      .select({ total: countDistinct(actors.did) })
      .from(actors)
      .leftJoin(follows, eq(follows.subjectDid, actors.did))
      .leftJoin(subscriptions, eq(subscriptions.actorDid, follows.actorDid))
      .where(this.isTrackedActor());
    return row?.total ?? 0;
  }

  private isTrackedActor() {
    const { actors, subscriptions } = schema;
    return or(
      isNotNull(subscriptions.actorDid),
      inArray(
        actors.did,
        this.db.select({ did: subscriptions.actorDid }).from(subscriptions),
      ),
    );
  }

  async find(actorDid: Did): Promise<Subscription | null> {
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
        seenAt: subscription.seenAt,
        createdAt: subscription.createdAt,
      })
      .onConflictDoUpdate({
        target: schema.subscriptions.actorDid,
        set: {
          inviteCode: subscription.inviteCode,
          seenAt: subscription.seenAt,
          createdAt: subscription.createdAt,
        },
      });
  }

  async delete(actorDid: Did): Promise<void> {
    await this.db
      .delete(schema.subscriptions)
      .where(eq(schema.subscriptions.actorDid, actorDid));
  }
}
