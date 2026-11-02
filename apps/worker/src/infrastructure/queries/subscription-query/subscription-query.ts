import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { ISubscriptionQuery } from "../../../application/interfaces/queries/subscription-query.js";

export class SubscriptionQuery implements ISubscriptionQuery {
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

  async isFollowedByAnySubscriber(
    ctx: TransactionContext,
    subjectDid: string,
  ): Promise<boolean> {
    const result = await ctx.db
      .select({ actorDid: schema.follows.actorDid })
      .from(schema.follows)
      .innerJoin(
        schema.subscriptions,
        eq(schema.follows.actorDid, schema.subscriptions.actorDid),
      )
      .where(eq(schema.follows.subjectDid, subjectDid))
      .limit(1);

    return result.length > 0;
  }
}
