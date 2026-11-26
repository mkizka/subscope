import type { ITransactionManager, JobData } from "@repo/common/interface";

import type { JobLogger } from "../../../shared/job.js";
import type { IWebPushSender } from "../../interfaces/external/web-push-sender.js";
import type { IPushNotificationQuery } from "../../interfaces/queries/push-notification-query.js";
import type { IPushSubscriptionRepository } from "../../interfaces/repositories/push-subscription-repository.js";

export class SendPushNotificationUseCase {
  constructor(
    private readonly deps: {
      pushNotificationQuery: IPushNotificationQuery;
      pushSubscriptionRepository: IPushSubscriptionRepository;
      webPushSender: IWebPushSender;
      transactionManager: ITransactionManager;
    },
  ) {}

  async execute({
    recordUri,
    recipientDid,
    jobLogger,
  }: JobData["sendPushNotification"] & { jobLogger: JobLogger }) {
    const found = await this.deps.transactionManager.transaction(
      async (ctx) => {
        const notification = await this.deps.pushNotificationQuery.find({
          ctx,
          recordUri,
          recipientDid,
        });
        if (!notification) return null;
        const subscriptions =
          await this.deps.pushNotificationQuery.findSubscriptions({
            ctx,
            accountDid: recipientDid,
          });
        return { notification, subscriptions };
      },
    );
    if (!found || found.subscriptions.length === 0) return;

    const payload = found.notification.payload;
    const goneEndpoints: string[] = [];
    await Promise.all(
      found.subscriptions.map(async (subscription) => {
        try {
          const result = await this.deps.webPushSender.send(
            subscription,
            payload,
          );
          if (result === "gone") goneEndpoints.push(subscription.endpoint);
        } catch (e) {
          await jobLogger.log(
            `Failed to send push to ${subscription.endpoint}: ${String(e)}`,
          );
        }
      }),
    );
    if (goneEndpoints.length === 0) return;
    await this.deps.transactionManager.transaction(async (ctx) => {
      for (const endpoint of goneEndpoints) {
        await this.deps.pushSubscriptionRepository.delete({ ctx, endpoint });
      }
    });
  }
}
