import type { TransactionContext } from "@repo/common/domain";

import type {
  INotificationRepository,
  Notification,
} from "../../../application/interfaces/repositories/notification-repository.js";

export class InMemoryNotificationRepository implements INotificationRepository {
  private notifications: Map<string, Notification> = new Map();

  clear(): void {
    this.notifications.clear();
  }

  findAll(): Notification[] {
    return Array.from(this.notifications.values());
  }

  async createMany({
    notifications,
  }: {
    ctx: TransactionContext;
    notifications: Notification[];
  }): Promise<void> {
    for (const n of notifications) {
      const key = `${n.recordUri}:${n.recipientDid}`;
      if (!this.notifications.has(key)) this.notifications.set(key, n);
    }
  }
}
