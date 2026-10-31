import type { Notification } from "@repo/client/lex/app/bsky/notification/listNotifications";

import type { INotificationQuery } from "@/app/server/infrastructure/notification/notification-query";

export interface IGetNotificationsUseCase {
  execute: (
    did: string,
    cursor?: string,
  ) => Promise<{
    notifications: Notification[];
    cursor?: string;
    subjectTexts: Record<string, unknown>;
  }>;
}

export const getNotificationsUseCaseFactory = ({
  notificationQuery,
}: {
  notificationQuery: INotificationQuery;
}): IGetNotificationsUseCase => ({
  async execute(did, cursor) {
    const { notifications, cursor: nextCursor } =
      await notificationQuery.findMany(did, cursor);
    const subjectUris = [
      ...new Set(
        notifications.flatMap((notification) =>
          ["like", "repost"].includes(notification.reason) &&
          notification.reasonSubject
            ? [notification.reasonSubject]
            : [],
        ),
      ),
    ];
    return {
      notifications,
      cursor: nextCursor,
      subjectTexts: await notificationQuery.findPostTexts(did, subjectUris),
    };
  },
});
