import type { Notification } from "@repo/client/lex/app/bsky/notification/listNotifications";

import type { INotificationRepository } from "@/app/server/infrastructure/notification/notification-repository";

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
  notificationRepository,
}: {
  notificationRepository: INotificationRepository;
}): IGetNotificationsUseCase => ({
  async execute(did, cursor) {
    const { notifications, cursor: nextCursor } =
      await notificationRepository.findMany(did, cursor);
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
      subjectTexts: await notificationRepository.findPostTexts(
        did,
        subjectUris,
      ),
    };
  },
});
