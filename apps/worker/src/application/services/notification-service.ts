import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import {
  type Notification,
  selectDeliverable,
} from "../../domain/notification.js";
import type { Origin } from "../../domain/origin.js";
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
    const candidates = await notifications();
    const memberDids = new Set<string>();
    for (const did of new Set(candidates.map((c) => c.recipientDid))) {
      const isMember = await this.registrationQuery.isRegistered(ctx, did);
      if (isMember) {
        memberDids.add(did);
      }
    }
    const created = await this.notificationRepository.save({
      ctx,
      notifications: selectDeliverable(candidates, memberDids),
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
