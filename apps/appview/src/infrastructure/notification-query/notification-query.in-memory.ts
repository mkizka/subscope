import type { Did } from "@atproto/did";

import type {
  NotificationDto,
  NotificationReason,
} from "../../application/dto/notification-dto.js";
import type { INotificationQuery } from "../../application/interfaces/notification-query.js";

export class InMemoryNotificationQuery implements INotificationQuery {
  private items: (NotificationDto & { recipientDid: string })[] = [];

  add(item: NotificationDto & { recipientDid: string }): void {
    this.items.push(item);
  }

  findNotifications(params: {
    recipientDid: Did;
    limit: number;
    cursor?: Date;
    reasons?: NotificationReason[];
  }): Promise<NotificationDto[]> {
    const cursor = params.cursor;
    return Promise.resolve(
      this.items
        .filter((item) => item.recipientDid === params.recipientDid)
        .filter((item) => !cursor || item.sortAt < cursor)
        .filter(
          (item) => !params.reasons || params.reasons.includes(item.reason),
        )
        .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
        .slice(0, params.limit),
    );
  }

  countUnread(recipientDid: Did, seenAt?: Date): Promise<number> {
    return Promise.resolve(
      this.items.filter(
        (item) =>
          item.recipientDid === recipientDid &&
          (seenAt ? item.sortAt > seenAt : !item.isRead),
      ).length,
    );
  }
}
