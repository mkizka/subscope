import type { Did } from "@atproto/did";
import {
  type DatabaseClient,
  Subscription,
  type TransactionContext,
} from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq, lt } from "drizzle-orm";

import type { ISubscriptionRepository } from "../application/interfaces/subscription-repository.js";

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

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
          createdAt: row.createdAt,
        }),
    );
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
    await ctx.db.insert(schema.subscriptions).values({
      actorDid: subscription.actorDid,
      inviteCode: subscription.inviteCode,
      createdAt: subscription.createdAt,
    });
  }

  async delete(actorDid: Did): Promise<void> {
    await this.db
      .delete(schema.subscriptions)
      .where(eq(schema.subscriptions.actorDid, actorDid));
  }
}
