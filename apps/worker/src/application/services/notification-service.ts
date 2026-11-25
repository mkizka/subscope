import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type { Origin } from "../../domain/origin.js";
import type { Notification } from "../dto/notification.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";
import type { INotificationRepository } from "../interfaces/repositories/notification-repository.js";

export class NotificationService {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async notify({
    ctx,
    origin,
    notifications,
  }: {
    ctx: AfterCommitContext;
    origin: Origin;
    notifications: () => Notification[] | Promise<Notification[]>;
  }) {
    if (!origin.notifies) {
      return;
    }
    const byRecipient = new Map<string, Notification>();
    for (const notification of await notifications()) {
      const { recipientDid, authorDid } = notification;
      if (recipientDid === authorDid || byRecipient.has(recipientDid)) {
        continue;
      }
      const isMember = await this.registrationQuery.isRegistered(
        ctx,
        recipientDid,
      );
      if (isMember) {
        byRecipient.set(recipientDid, notification);
      }
    }
    const created = await this.notificationRepository.save({
      ctx,
      notifications: [...byRecipient.values()],
    });
    for (const { recordUri, recipientDid } of created) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleSendPushNotification(
          new AtUri(recordUri),
          asDid(recipientDid),
        ),
      );
    }
  }
}
