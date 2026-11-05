import type { DatetimeString } from "@atproto/syntax";

export interface INotificationCommand {
  updateSeen: (did: string, seenAt: DatetimeString) => Promise<void>;
}
