import type { AtUriString } from "@atproto/syntax";
import type { Notification } from "@repo/client/lex/app/bsky/notification/listNotifications";

export interface INotificationQuery {
  findMany: (
    did: string,
    cursor?: string,
  ) => Promise<{ notifications: Notification[]; cursor?: string }>;
  findPostTexts: (
    did: string,
    uris: AtUriString[],
  ) => Promise<Record<string, unknown>>;
  countUnread: (did: string) => Promise<{ count: number }>;
}
