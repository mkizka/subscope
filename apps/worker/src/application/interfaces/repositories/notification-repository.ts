import type { TransactionContext } from "@repo/common/domain";

export type Notification = {
  recordUri: string;
  recipientDid: string;
  authorDid: string;
  reason: "like" | "repost" | "follow" | "mention" | "reply" | "quote";
  reasonSubject: string | null;
  sortAt: Date;
};

export interface INotificationRepository {
  createMany: (params: {
    ctx: TransactionContext;
    notifications: Notification[];
  }) => Promise<void>;
}
