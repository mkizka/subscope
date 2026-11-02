import type { Did } from "@atproto/did";
import {
  type DatabaseClient,
  Subscription,
  type TransactionContext,
} from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { ISubscriptionRepository } from "../../application/interfaces/subscription-repository.js";

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly db: DatabaseClient) {}

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
