import type { Did } from "@atproto/did";

import type {
  INotificationRepository,
  NotificationItem,
} from "../../application/interfaces/notification-repository.js";

export class InMemoryNotificationRepository implements INotificationRepository {
  private items: (NotificationItem & { recipientDid: string })[] = [];

  add(item: NotificationItem & { recipientDid: string }): void {
    this.items.push(item);
  }

  findMany(params: {
    recipientDid: Did;
    limit: number;
    cursor?: Date;
  }): Promise<NotificationItem[]> {
    const cursor = params.cursor;
    return Promise.resolve(
      this.items
        .filter((item) => item.recipientDid === params.recipientDid)
        .filter((item) => !cursor || item.sortAt < cursor)
        .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
        .slice(0, params.limit),
    );
  }

  countUnread(recipientDid: Did): Promise<number> {
    return Promise.resolve(
      this.items.filter(
        (item) => item.recipientDid === recipientDid && !item.isRead,
      ).length,
    );
  }
}
