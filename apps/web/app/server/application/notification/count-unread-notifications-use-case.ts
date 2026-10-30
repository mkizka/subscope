import type { INotificationRepository } from "@/app/server/infrastructure/notification/notification-repository";

export interface ICountUnreadNotificationsUseCase {
  execute: (did: string) => Promise<{ count: number }>;
}

export const countUnreadNotificationsUseCaseFactory = ({
  notificationRepository,
}: {
  notificationRepository: INotificationRepository;
}): ICountUnreadNotificationsUseCase => ({
  execute: (did) => notificationRepository.countUnread(did),
});
