import type { TransactionContext } from "@repo/common/interface";

import type { PushNotification } from "../../../domain/push-notification.js";
import type { PushSubscription } from "../external/web-push-sender.js";

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
