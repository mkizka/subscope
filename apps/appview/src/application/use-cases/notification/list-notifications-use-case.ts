import { asDid, type Did } from "@atproto/did";
import { asAtUriString, toDatetimeString } from "@atproto/syntax";
import type * as AppBskyNotificationListNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";

import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import {
  type INotificationRepository,
  isNotificationReason,
  type NotificationItem,
} from "../../interfaces/notification-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/subscription-repository.js";
import { toMapByDid } from "../../utils/map.js";
import { createCursorPaginator } from "../../utils/pagination.js";

export class ListNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly profileViewService: ProfileViewService,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = [
    "notificationRepository",
    "profileViewService",
    "subscriptionRepository",
  ] as const;

  async execute(params: {
    viewerDid: Did;
    limit: number;
    cursor?: string;
    reasons?: string[];
  }): Promise<AppBskyNotificationListNotifications.$OutputBody> {
    const paginator = createCursorPaginator<NotificationItem>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });
    const items = await this.notificationRepository.findMany({
      recipientDid: params.viewerDid,
      limit: paginator.queryLimit,
      cursor: params.cursor ? new Date(params.cursor) : undefined,
      reasons: params.reasons?.filter(isNotificationReason),
    });
    const page = paginator.extractPage(items);

    const authors = toMapByDid(
      await this.profileViewService.findProfileView(
        [...new Set(page.items.map((item) => asDid(item.authorDid)))],
        params.viewerDid,
      ),
    );

    const subscription = await this.subscriptionRepository.findFirst(
      params.viewerDid,
    );

    return {
      cursor: page.cursor,
      seenAt: subscription?.seenAt
        ? toDatetimeString(subscription.seenAt)
        : undefined,
      notifications: page.items.flatMap((item) => {
        const author = authors.get(asDid(item.authorDid));
        if (!author) return [];
        return {
          uri: asAtUriString(item.recordUri),
          cid: item.cid,
          author,
          reason: item.reason,
          reasonSubject: item.reasonSubject
            ? asAtUriString(item.reasonSubject)
            : undefined,
          record:
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            item.record as AppBskyNotificationListNotifications.Notification["record"],
          isRead: item.isRead,
          indexedAt: toDatetimeString(item.sortAt),
        };
      }),
    };
  }
}
