import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import getUnreadCount from "@repo/client/lex/app/bsky/notification/getUnreadCount";
import listNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";

import type { INotificationQuery } from "@/app/server/application/interfaces/notification-query";
import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export const notificationQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): INotificationQuery => {
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
  };
};
