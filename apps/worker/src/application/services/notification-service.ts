import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type { Notification } from "../../domain/notification.js";
import type { Origin } from "../../domain/origin.js";
import type { NotificationPolicy } from "../../domain/services/notification-policy.js";
import type { INotificationRepository } from "../interfaces/repositories/notification-repository.js";

export class NotificationService {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly notificationPolicy: NotificationPolicy,
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
    const deliverable = await this.notificationPolicy.selectDeliverable({
      ctx,
      origin,
      candidates: notifications,
    });
    const created = await this.notificationRepository.save({
      ctx,
      notifications: deliverable,
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
