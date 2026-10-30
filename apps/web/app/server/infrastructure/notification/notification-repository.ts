import type { AtUriString, DatetimeString } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import getUnreadCount from "@repo/client/lex/app/bsky/notification/getUnreadCount";
import type { Notification } from "@repo/client/lex/app/bsky/notification/listNotifications";
import listNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";
import updateSeen from "@repo/client/lex/app/bsky/notification/updateSeen";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export interface INotificationRepository {
  findMany: (
    did: string,
    cursor?: string,
  ) => Promise<{ notifications: Notification[]; cursor?: string }>;
  findPostTexts: (
    did: string,
    uris: AtUriString[],
  ) => Promise<Record<string, unknown>>;
  countUnread: (did: string) => Promise<{ count: number }>;
  updateSeen: (did: string, seenAt: DatetimeString) => Promise<void>;
}

export const notificationRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): INotificationRepository => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("Failed to restore OAuth session");
    return agent;
  };
  return {
    async findMany(did, cursor) {
      const agent = await restore(did);
      return agent.call(listNotifications, { limit: 25, cursor });
    },
    async findPostTexts(did, uris) {
      if (uris.length === 0) return {};
      const agent = await restore(did);
      const { posts } = await agent.call(getPosts, { uris });
      return Object.fromEntries(
        posts.map((post) => [post.uri, post.record.text]),
      );
    },
    async countUnread(did) {
      const agent = await restore(did);
      return agent.call(getUnreadCount, {});
    },
    async updateSeen(did, seenAt) {
      const agent = await restore(did);
      await agent.call(updateSeen, { seenAt });
    },
  };
};
