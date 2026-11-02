import type { Did } from "@atproto/did";

import type { INotificationQuery } from "../../interfaces/queries/notification-query.js";

export class GetUnreadCountUseCase {
  constructor(private readonly notificationQuery: INotificationQuery) {}

  async execute(viewerDid: Did, seenAt?: Date): Promise<number> {
    return await this.notificationQuery.countUnread(viewerDid, seenAt);
  }
}
