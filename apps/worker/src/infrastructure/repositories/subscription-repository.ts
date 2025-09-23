import type { Subscription, TransactionContext } from "@repo/common/domain";
import { schema, type SubscriptionInsert } from "@repo/db";
import { and, eq, exists, inArray } from "drizzle-orm";

import type { ISubscriptionRepository } from "../../application/interfaces/repositories/subscription-repository.js";

export class SubscriptionRepository implements ISubscriptionRepository {
  async upsert({
    ctx,
    subscription,
  }: {
    ctx: TransactionContext;
    subscription: Subscription;
  }) {
    const data = {
      actorDid: subscription.actorDid,
      inviteCode: subscription.inviteCode,
      createdAt: subscription.createdAt,
    } satisfies SubscriptionInsert;
    await ctx.db
      .insert(schema.subscriptions)
      .values(data)
      .onConflictDoUpdate({
        target: schema.subscriptions.actorDid,
        set: {
          inviteCode: subscription.inviteCode,
          createdAt: subscription.createdAt,
        },
      });
  }

  async isSubscriber(
    ctx: TransactionContext,
    actorDid: string,
  ): Promise<boolean> {
    const result = await ctx.db
      .select({ actorDid: schema.subscriptions.actorDid })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.actorDid, actorDid))
      .limit(1);

    return result.length > 0;
  }

  async hasSubscriber(
    ctx: TransactionContext,
    actorDids: string[],
  ): Promise<boolean> {
    if (actorDids.length === 0) {
      return false;
    }

    const result = await ctx.db
      .select({ actorDid: schema.subscriptions.actorDid })
      .from(schema.subscriptions)
      .where(inArray(schema.subscriptions.actorDid, actorDids))
      .limit(1);

    return result.length > 0;
  }

  async isFolloweeOfSubscribers(
    ctx: TransactionContext,
    actorDid: string,
  ): Promise<boolean> {
    const result = await ctx.db
      .select({ actorDid: schema.follows.actorDid })
      .from(schema.follows)
      .where(
        and(
          eq(schema.follows.subjectDid, actorDid), // actorDidがフォロイーであるフォロー関係
          exists(
            ctx.db
              .select()
              .from(schema.subscriptions)
              .where(
                eq(schema.subscriptions.actorDid, schema.follows.actorDid),
              ),
          ),
        ),
      )
      .limit(1);

    return result.length > 0;
  }

  async hasFolloweeOfSubscribers(
    ctx: TransactionContext,
    actorDids: string[],
  ): Promise<boolean> {
    if (actorDids.length === 0) {
      return false;
    }

    const result = await ctx.db
      .select({ actorDid: schema.follows.actorDid })
      .from(schema.follows)
      .where(
        and(
          inArray(schema.follows.subjectDid, actorDids), // actorDidsのいずれかがフォロイーであるフォロー関係
          exists(
            ctx.db
              .select()
              .from(schema.subscriptions)
              .where(
                eq(schema.subscriptions.actorDid, schema.follows.actorDid),
              ),
          ),
        ),
      )
      .limit(1);

    return result.length > 0;
  }
}
