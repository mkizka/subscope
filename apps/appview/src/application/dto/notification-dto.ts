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

export type NotificationDto = {
  recordUri: string;
  cid: string;
  record: unknown;
  authorDid: string;
  reason: NotificationReason;
  reasonSubject: string | null;
  sortAt: Date;
  isRead: boolean;
};
