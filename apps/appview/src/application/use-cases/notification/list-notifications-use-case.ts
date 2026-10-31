import { asDid, type Did } from "@atproto/did";
import { asAtUriString, toDatetimeString } from "@atproto/syntax";
import type * as AppBskyNotificationListNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";

import {
  isNotificationReason,
  type NotificationDto,
} from "../../dto/notification-dto.js";
import type { INotificationQuery } from "../../interfaces/notification-query.js";
import type { ISubscriptionRepository } from "../../interfaces/subscription-repository.js";
import { createCursorPaginator } from "../../utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class ListNotificationsUseCase {
  constructor(
    private readonly notificationQuery: INotificationQuery,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    viewerDid: Did;
    limit: number;
    cursor?: string;
    reasons?: string[];
  }): Promise<AppBskyNotificationListNotifications.$OutputBody> {
    const paginator = createCursorPaginator<NotificationDto>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });
    const items = await this.notificationQuery.findNotifications({
      recipientDid: params.viewerDid,
      limit: paginator.queryLimit,
      cursor: params.cursor ? new Date(params.cursor) : undefined,
      reasons: params.reasons?.filter(isNotificationReason),
    });
    const page = paginator.extractPage(items);

    const ctx = this.viewContextFactory.create({ viewerDid: params.viewerDid });
    const [authors, subscription] = await Promise.all([
      Promise.all(
        page.items.map((item) =>
          this.profileViews.view(asDid(item.authorDid), ctx),
        ),
      ),
      this.subscriptionRepository.findFirst(params.viewerDid),
    ]);

    return {
      cursor: page.cursor,
      seenAt: subscription?.seenAt
        ? toDatetimeString(subscription.seenAt)
        : undefined,
      notifications: page.items.flatMap((item, i) => {
        const author = authors[i];
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
