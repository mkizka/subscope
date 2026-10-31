import type { INotificationQuery } from "@/app/server/infrastructure/notification/notification-query";

export interface ICountUnreadNotificationsUseCase {
  execute: (did: string) => Promise<{ count: number }>;
}

export const countUnreadNotificationsUseCaseFactory = ({
  notificationQuery,
}: {
  notificationQuery: INotificationQuery;
}): ICountUnreadNotificationsUseCase => ({
  execute: (did) => notificationQuery.countUnread(did),
});
