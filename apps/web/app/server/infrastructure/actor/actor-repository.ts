import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/lex/app/bsky/actor/defs";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import getAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";
import verifyAccess from "@repo/client/lex/me/subsco/admin/verifyAccess";

import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";
import { toTimelinePost } from "@/app/server/infrastructure/timeline/timeline-repository";

export interface IActorRepository {
  findProfile: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<ProfileViewDetailed>;
  findPosts: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<TimelinePost[]>;
  isAdmin: (did: string) => Promise<boolean>;
}

export const actorRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IActorRepository => {
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
    async findPosts(did, actor) {
      const agent = await restore(did);
      // ponytail: 最初の20件のみ。古い投稿の読み込みはapi.timelineと同様のAPIルートを足すとき
      const { feed } = await agent.call(getAuthorFeed, { actor, limit: 20 });
      return feed.map(toTimelinePost);
    },
    async isAdmin(did) {
      const agent = await restore(did);
      const { status } = await agent.call(verifyAccess);
      return status === "authorized";
    },
  };
};
