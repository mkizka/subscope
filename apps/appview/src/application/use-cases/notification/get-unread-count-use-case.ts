import type { Did } from "@atproto/did";

import type { INotificationRepository } from "../../interfaces/notification-repository.js";

export class GetUnreadCountUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}
  static inject = ["notificationRepository"] as const;

  async execute(viewerDid: Did, seenAt?: Date): Promise<number> {
    return await this.notificationRepository.countUnread(viewerDid, seenAt);
  }
}
