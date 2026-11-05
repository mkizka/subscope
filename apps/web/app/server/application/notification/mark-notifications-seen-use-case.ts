import type { DatetimeString } from "@atproto/syntax";

import type { INotificationCommand } from "@/app/server/application/interfaces/notification-command";

export interface IMarkNotificationsSeenUseCase {
  execute: (did: string, seenAt: DatetimeString) => Promise<void>;
}

export const markNotificationsSeenUseCaseFactory = ({
  notificationCommand,
}: {
  notificationCommand: INotificationCommand;
}): IMarkNotificationsSeenUseCase => ({
  execute: (did, seenAt) => notificationCommand.updateSeen(did, seenAt),
});
