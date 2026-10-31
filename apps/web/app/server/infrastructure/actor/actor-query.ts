import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/lex/app/bsky/actor/defs";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import getActorLikes from "@repo/client/lex/app/bsky/feed/getActorLikes";
import getAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";
import verifyAccess from "@repo/client/lex/me/subsco/admin/verifyAccess";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";
import {
  type TimelinePostDto,
  toTimelinePost,
} from "@/app/server/infrastructure/timeline/timeline-query";

export type ProfileTab = "posts" | "replies" | "media" | "likes";

const filters = {
  posts: "posts_no_replies",
  replies: "posts_with_replies",
  media: "posts_with_media",
} as const;

export interface IActorQuery {
  findProfile: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<ProfileViewDetailed>;
  findPosts: (
    did: string,
    actor: AtIdentifierString,
    tab: ProfileTab,
  ) => Promise<TimelinePostDto[]>;
  isAdmin: (did: string) => Promise<boolean>;
}

export const actorQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IActorQuery => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("OAuth session not found");
    return agent;
  };
  return {
    async findProfile(did, actor) {
      const agent = await restore(did);
      return agent.call(getProfile, { actor });
    },
    async findPosts(did, actor, tab) {
      const agent = await restore(did);
      // ponytail: 最初の20件のみ。古い投稿の読み込みはapi.timelineと同様のAPIルートを足すとき
      const { feed } =
        tab === "likes"
          ? await agent.call(getActorLikes, { actor, limit: 20 })
          : await agent.call(getAuthorFeed, {
              actor,
              limit: 20,
              filter: filters[tab],
            });
      return feed.map(toTimelinePost);
    },
    async isAdmin(did) {
      const agent = await restore(did);
      const { status } = await agent.call(verifyAccess);
      return status === "authorized";
    },
  };
};
