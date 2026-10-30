import type { DatetimeString } from "@atproto/syntax";

import type { INotificationRepository } from "@/app/server/infrastructure/notification/notification-repository";

export interface IMarkNotificationsSeenUseCase {
  execute: (did: string, seenAt: DatetimeString) => Promise<void>;
}

export const markNotificationsSeenUseCaseFactory = ({
  notificationRepository,
}: {
  notificationRepository: INotificationRepository;
}): IMarkNotificationsSeenUseCase => ({
  execute: (did, seenAt) => notificationRepository.updateSeen(did, seenAt),
});
