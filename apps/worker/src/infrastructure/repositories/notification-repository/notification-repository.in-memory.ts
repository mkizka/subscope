import type { TransactionContext } from "@repo/common/interface";

import type { Notification } from "../../../application/dto/notification.js";
import type { INotificationRepository } from "../../../application/interfaces/repositories/notification-repository.js";

export class InMemoryNotificationRepository implements INotificationRepository {
  private notifications: Map<string, Notification> = new Map();

  clear(): void {
    this.notifications.clear();
  }

  findAll(): Notification[] {
    return Array.from(this.notifications.values());
  }

  async save({
    notifications,
  }: {
    ctx: TransactionContext;
    notifications: Notification[];
  }) {
    const created = [];
    for (const n of notifications) {
      const key = `${n.recordUri}:${n.recipientDid}`;
      if (this.notifications.has(key)) continue;
      this.notifications.set(key, n);
      created.push(n);
    }
    return created;
  }
}
