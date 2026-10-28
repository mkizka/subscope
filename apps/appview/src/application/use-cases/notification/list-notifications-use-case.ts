import { asDid, type Did } from "@atproto/did";
import { asAtUriString, toDatetimeString } from "@atproto/syntax";
import type * as AppBskyNotificationListNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";

import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import type {
  INotificationRepository,
  NotificationItem,
} from "../../interfaces/notification-repository.js";
import { toMapByDid } from "../../utils/map.js";
import { createCursorPaginator } from "../../utils/pagination.js";

export class ListNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["notificationRepository", "profileViewService"] as const;

  async execute(params: {
    viewerDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<AppBskyNotificationListNotifications.$OutputBody> {
    const paginator = createCursorPaginator<NotificationItem>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });
    const items = await this.notificationRepository.findMany({
      recipientDid: params.viewerDid,
      limit: paginator.queryLimit,
      cursor: params.cursor ? new Date(params.cursor) : undefined,
    });
    const page = paginator.extractPage(items);

    const authors = toMapByDid(
      await this.profileViewService.findProfileView(
        [...new Set(page.items.map((item) => asDid(item.authorDid)))],
        params.viewerDid,
      ),
    );

    return {
      cursor: page.cursor,
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
