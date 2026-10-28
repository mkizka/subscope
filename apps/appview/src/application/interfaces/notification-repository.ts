import type { Did } from "@atproto/did";

export type NotificationItem = {
  recordUri: string;
  cid: string;
  record: unknown;
  authorDid: string;
  reason: "like" | "repost" | "follow" | "mention" | "reply" | "quote";
  reasonSubject: string | null;
  sortAt: Date;
  isRead: boolean;
};

export interface INotificationRepository {
  findMany: (params: {
    recipientDid: Did;
    limit: number;
    cursor?: Date;
  }) => Promise<NotificationItem[]>;
}
