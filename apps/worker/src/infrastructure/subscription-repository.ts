import type { Subscription, TransactionContext } from "@dawn/common/domain";
import { schema } from "@dawn/db";

import type { ISubscriptionRepository } from "../application/interfaces/subscription-repository.js";

export class SubscriptionRepository implements ISubscriptionRepository {
  async upsert({
    ctx,
    subscription,
  }: {
    ctx: TransactionContext;
    subscription: Subscription;
  }) {
    const data = {
      cid: subscription.cid,
      actorDid: subscription.actorDid,
      appviewDid: subscription.appviewDid,
      createdAt: subscription.createdAt,
    };
    await ctx.db
      .insert(schema.subscriptions)
      .values({
        uri: subscription.uri.toString(),
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.subscriptions.uri,
        set: data,
      });
  }
}
