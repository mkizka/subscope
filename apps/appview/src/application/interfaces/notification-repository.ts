import type { Did } from "@atproto/did";

export const notificationReasons = [
  "like",
  "repost",
  "follow",
  "mention",
  "reply",
  "quote",
] as const;

export type NotificationReason = (typeof notificationReasons)[number];

export const isNotificationReason = (
  reason: string,
): reason is NotificationReason =>
  notificationReasons.some((known) => known === reason);

export type NotificationItem = {
  recordUri: string;
  cid: string;
  record: unknown;
  authorDid: string;
  reason: NotificationReason;
  reasonSubject: string | null;
  sortAt: Date;
  isRead: boolean;
};

export interface INotificationRepository {
  findMany: (params: {
    recipientDid: Did;
    limit: number;
    cursor?: Date;
    reasons?: NotificationReason[];
  }) => Promise<NotificationItem[]>;
  countUnread: (recipientDid: Did) => Promise<number>;
}
