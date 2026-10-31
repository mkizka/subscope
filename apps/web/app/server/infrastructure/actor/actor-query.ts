import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/lex/app/bsky/actor/defs";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import searchActors from "@repo/client/lex/app/bsky/actor/searchActors";
import getAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";
import verifyAccess from "@repo/client/lex/me/subsco/admin/verifyAccess";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";
import {
  type TimelinePostDto,
  toTimelinePost,
} from "@/app/server/infrastructure/timeline/timeline-query";

export type ActorDto = {
  did: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  description?: string;
};

export interface IActorQuery {
  findProfile: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<ProfileViewDetailed>;
  findPosts: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<TimelinePostDto[]>;
  isAdmin: (did: string) => Promise<boolean>;
  searchActors: (did: string, q: string) => Promise<ActorDto[]>;
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
    async searchActors(did, q) {
      const agent = await restore(did);
      // ponytail: 最初の25件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const { actors } = await agent.call(searchActors, { q });
      return actors.map((actor) => ({
        did: actor.did,
        handle: actor.handle,
        displayName: actor.displayName,
        avatarUrl: actor.avatar,
        description: actor.description,
      }));
    },
  };
};
