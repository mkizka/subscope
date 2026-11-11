import type { DatabaseClient } from "@repo/common/interface";
import { schema } from "@repo/db";
import { and, eq } from "drizzle-orm";

import type { IPushSubscriptionCommand } from "@/app/server/application/interfaces/push-subscription-command";

export const pushSubscriptionCommandFactory = ({
  db,
}: {
  db: DatabaseClient;
}): IPushSubscriptionCommand => ({
  async upsert(did, { endpoint, p256dh, auth }) {
    await db
      .insert(schema.pushSubscriptions)
      .values({ endpoint, accountDid: did, p256dh, auth })
      .onConflictDoUpdate({
        target: schema.pushSubscriptions.endpoint,
        set: { accountDid: did, p256dh, auth, createdAt: new Date() },
      });
  },
  async delete(did, endpoint) {
    await db
      .delete(schema.pushSubscriptions)
      .where(
        and(
          eq(schema.pushSubscriptions.endpoint, endpoint),
          eq(schema.pushSubscriptions.accountDid, did),
        ),
      );
  },
});
