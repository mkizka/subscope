import type { Did } from "@atproto/did";

import type {
  NotificationDto,
  NotificationReason,
} from "../../dto/notification-dto.js";

export interface INotificationQuery {
  findNotifications: (params: {
    recipientDid: Did;
    limit: number;
    cursor?: Date;
    reasons?: NotificationReason[];
  }) => Promise<NotificationDto[]>;
  countUnread: (recipientDid: Did, seenAt?: Date) => Promise<number>;
}
