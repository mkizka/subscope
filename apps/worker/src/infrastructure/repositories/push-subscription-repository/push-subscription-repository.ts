import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IPushSubscriptionRepository } from "../../../application/interfaces/repositories/push-subscription-repository.js";

export class PushSubscriptionRepository implements IPushSubscriptionRepository {
  async delete({
    ctx,
    endpoint,
  }: {
    ctx: TransactionContext;
    endpoint: string;
  }): Promise<void> {
    await ctx.db
      .delete(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.endpoint, endpoint));
  }
}
