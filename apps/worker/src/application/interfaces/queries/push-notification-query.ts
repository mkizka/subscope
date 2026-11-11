import type { TransactionContext } from "@repo/common/interface";

import type { PushSubscription } from "../external/web-push-sender.js";

export type PushNotification = {
  recordUri: string;
  reason: "like" | "repost" | "follow" | "mention" | "reply" | "quote";
  reasonSubject: string | null;
  authorName: string;
  postText: string | null;
};

export interface IPushNotificationQuery {
  find: (params: {
    ctx: TransactionContext;
    recordUri: string;
    recipientDid: string;
  }) => Promise<PushNotification | null>;
  findSubscriptions: (params: {
    ctx: TransactionContext;
    accountDid: string;
  }) => Promise<PushSubscription[]>;
}
