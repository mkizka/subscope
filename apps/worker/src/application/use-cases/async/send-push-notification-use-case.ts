import type { ITransactionManager, JobData } from "@repo/common/interface";

import type { JobLogger } from "../../../shared/job.js";
import type {
  IWebPushSender,
  PushPayload,
} from "../../interfaces/external/web-push-sender.js";
import type {
  IPushNotificationQuery,
  PushNotification,
} from "../../interfaces/queries/push-notification-query.js";
import type { IPushSubscriptionRepository } from "../../interfaces/repositories/push-subscription-repository.js";

const TITLES = {
  like: "さんがいいねしました",
  repost: "さんがリポストしました",
  follow: "さんにフォローされました",
  reply: "さんが返信しました",
  quote: "さんが引用しました",
  mention: "さんがメンションしました",
} satisfies Record<PushNotification["reason"], string>;

const createPayload = (notification: PushNotification): PushPayload => {
  const isLikeOrRepost =
    notification.reason === "like" || notification.reason === "repost";
  return {
    title: `${notification.authorName}${TITLES[notification.reason]}`,
    body: notification.postText ?? "",
    // 同じタグの通知は端末上で置き換わるので、同じ投稿へのいいね・リポストは1件にまとまる
    tag: isLikeOrRepost
      ? `${notification.reason}:${notification.reasonSubject}`
      : notification.recordUri,
  };
};

export class SendPushNotificationUseCase {
  constructor(
    private readonly pushNotificationQuery: IPushNotificationQuery,
    private readonly pushSubscriptionRepository: IPushSubscriptionRepository,
    private readonly webPushSender: IWebPushSender,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute({
    recordUri,
    recipientDid,
    jobLogger,
  }: JobData["sendPushNotification"] & { jobLogger: JobLogger }) {
    const found = await this.transactionManager.transaction(async (ctx) => {
      const notification = await this.pushNotificationQuery.find({
        ctx,
        recordUri,
        recipientDid,
      });
      if (!notification) return null;
      const subscriptions = await this.pushNotificationQuery.findSubscriptions({
        ctx,
        accountDid: recipientDid,
      });
      return { notification, subscriptions };
    });
    if (!found || found.subscriptions.length === 0) return;

    const payload = createPayload(found.notification);
    const goneEndpoints: string[] = [];
    await Promise.all(
      found.subscriptions.map(async (subscription) => {
        try {
          const result = await this.webPushSender.send(subscription, payload);
          if (result === "gone") goneEndpoints.push(subscription.endpoint);
        } catch (e) {
          await jobLogger.log(
            `Failed to send push to ${subscription.endpoint}: ${String(e)}`,
          );
        }
      }),
    );
    if (goneEndpoints.length === 0) return;
    await this.transactionManager.transaction(async (ctx) => {
      for (const endpoint of goneEndpoints) {
        await this.pushSubscriptionRepository.delete({ ctx, endpoint });
      }
    });
  }
}
