import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type {
  INotificationRepository,
  Notification,
} from "../interfaces/repositories/notification-repository.js";

export class NotificationService {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async create({
    ctx,
    notifications,
  }: {
    ctx: AfterCommitContext;
    notifications: Notification[];
  }) {
    const created = await this.notificationRepository.save({
      ctx,
      notifications,
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
