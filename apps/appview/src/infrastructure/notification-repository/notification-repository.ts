import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, lt } from "drizzle-orm";

import type {
  INotificationRepository,
  NotificationItem,
} from "../../application/interfaces/notification-repository.js";

export class NotificationRepository implements INotificationRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findMany(params: {
    recipientDid: Did;
    limit: number;
    cursor?: Date;
  }): Promise<NotificationItem[]> {
    const { notifications, records, subscriptions } = schema;
    const rows = await this.db
      .select({
        recordUri: notifications.recordUri,
        cid: records.cid,
        record: records.json,
        authorDid: notifications.authorDid,
        reason: notifications.reason,
        reasonSubject: notifications.reasonSubject,
        sortAt: notifications.sortAt,
        seenAt: subscriptions.seenAt,
      })
      .from(notifications)
      .innerJoin(records, eq(records.uri, notifications.recordUri))
      .leftJoin(
        subscriptions,
        eq(subscriptions.actorDid, notifications.recipientDid),
      )
      .where(
        and(
          eq(notifications.recipientDid, params.recipientDid),
          params.cursor ? lt(notifications.sortAt, params.cursor) : undefined,
        ),
      )
      .orderBy(desc(notifications.sortAt))
      .limit(params.limit);

    return rows.map(({ seenAt, ...row }) => ({
      ...row,
      isRead: seenAt !== null && row.sortAt <= seenAt,
    }));
  }
}
