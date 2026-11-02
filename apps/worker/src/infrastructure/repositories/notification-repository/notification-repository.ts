import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type {
  INotificationRepository,
  Notification,
} from "../../../application/interfaces/repositories/notification-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class NotificationRepository implements INotificationRepository {
  async save({
    ctx,
    notifications,
  }: {
    ctx: TransactionContext;
    notifications: Notification[];
  }): Promise<void> {
    if (notifications.length === 0) return;
    await ctx.db
      .insert(schema.notifications)
      .values(
        notifications.map((n) => ({ ...n, sortAt: sanitizeDate(n.sortAt) })),
      )
      .onConflictDoNothing();
  }
}
