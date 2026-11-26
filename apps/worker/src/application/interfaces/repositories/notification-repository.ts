import type { TransactionContext } from "@repo/common/interface";

import type { Notification } from "../../../domain/notification.js";

export interface INotificationRepository {
  save: (params: {
    ctx: TransactionContext;
    notifications: Notification[];
  }) => Promise<Pick<Notification, "recordUri" | "recipientDid">[]>;
}
