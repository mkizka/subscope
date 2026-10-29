import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, count, desc, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";

import type {
  INotificationRepository,
  NotificationItem,
  NotificationReason,
} from "../../application/interfaces/notification-repository.js";

export class NotificationRepository implements INotificationRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findMany(params: {
    recipientDid: Did;
    limit: number;
    cursor?: Date;
    reasons?: NotificationReason[];
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
          params.reasons
            ? inArray(notifications.reason, params.reasons)
            : undefined,
        ),
      )
      .orderBy(desc(notifications.sortAt))
      .limit(params.limit);

    return rows.map(({ seenAt, ...row }) => ({
      ...row,
      isRead: seenAt !== null && row.sortAt <= seenAt,
    }));
  }

  async countUnread(recipientDid: Did): Promise<number> {
    const { notifications, subscriptions } = schema;
    const [row] = await this.db
      .select({ count: count() })
      .from(notifications)
      .leftJoin(
        subscriptions,
        eq(subscriptions.actorDid, notifications.recipientDid),
      )
      .where(
        and(
          eq(notifications.recipientDid, recipientDid),
          or(
            isNull(subscriptions.seenAt),
            gt(notifications.sortAt, subscriptions.seenAt),
          ),
        ),
      );
    return row?.count ?? 0;
  }
}
