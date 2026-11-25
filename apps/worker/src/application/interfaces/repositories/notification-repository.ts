import type { TransactionContext } from "@repo/common/interface";

import type { Notification } from "../../dto/notification.js";

export interface INotificationRepository {
  save: (params: {
    ctx: TransactionContext;
    notifications: Notification[];
  }) => Promise<Pick<Notification, "recordUri" | "recipientDid">[]>;
}
