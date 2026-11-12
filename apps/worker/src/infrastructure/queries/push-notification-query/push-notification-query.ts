import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { and, eq, sql } from "drizzle-orm";

import type { PushSubscription } from "../../../application/interfaces/external/web-push-sender.js";
import type {
  IPushNotificationQuery,
  PushNotification,
} from "../../../application/interfaces/queries/push-notification-query.js";

export class PushNotificationQuery implements IPushNotificationQuery {
  async find({
    ctx,
    recordUri,
    recipientDid,
  }: {
    ctx: TransactionContext;
    recordUri: string;
    recipientDid: string;
  }): Promise<PushNotification | null> {
    const { notifications, accounts, profiles, posts } = schema;
    const [row] = await ctx.db
      .select({
        recordUri: notifications.recordUri,
        reason: notifications.reason,
        reasonSubject: notifications.reasonSubject,
        authorDid: notifications.authorDid,
        authorHandle: accounts.handle,
        authorDisplayName: profiles.displayName,
        postText: posts.text,
      })
      .from(notifications)
      .innerJoin(accounts, eq(accounts.did, notifications.authorDid))
      .leftJoin(profiles, eq(profiles.accountDid, notifications.authorDid))
      .leftJoin(
        posts,
        eq(
          posts.uri,
          sql`case when ${notifications.reason} in ('like', 'repost') then ${notifications.reasonSubject} else ${notifications.recordUri} end`,
        ),
      )
      .where(
        and(
          eq(notifications.recordUri, recordUri),
          eq(notifications.recipientDid, recipientDid),
        ),
      )
      .limit(1);
    if (!row) return null;
    return {
      recordUri: row.recordUri,
      reason: row.reason,
      reasonSubject: row.reasonSubject,
      authorName: row.authorDisplayName || row.authorHandle || row.authorDid,
      postText: row.postText,
    };
  }

  async findSubscriptions({
    ctx,
    accountDid,
  }: {
    ctx: TransactionContext;
    accountDid: string;
  }): Promise<PushSubscription[]> {
    return await ctx.db
      .select({
        endpoint: schema.pushSubscriptions.endpoint,
        p256dh: schema.pushSubscriptions.p256dh,
        auth: schema.pushSubscriptions.auth,
      })
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.accountDid, accountDid));
  }
}
