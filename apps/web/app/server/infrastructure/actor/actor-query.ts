import type { AtIdentifierString } from "@atproto/syntax";
import type {
  ProfileView,
  ProfileViewDetailed,
} from "@repo/client/lex/app/bsky/actor/defs";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import getAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";
import getFollowers from "@repo/client/lex/app/bsky/graph/getFollowers";
import getFollows from "@repo/client/lex/app/bsky/graph/getFollows";
import verifyAccess from "@repo/client/lex/me/subsco/admin/verifyAccess";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";
import {
  type TimelinePostDto,
  toTimelinePost,
} from "@/app/server/infrastructure/timeline/timeline-query";

type ActorDto = {
  did: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  description?: string;
};

export type FollowListDto = {
  subject: ActorDto;
  actors: ActorDto[];
};

const toActor = (profile: ProfileView): ActorDto => ({
  did: profile.did,
  handle: profile.handle,
  displayName: profile.displayName,
  avatarUrl: profile.avatar,
  description: profile.description,
});

export interface IActorQuery {
  findProfile: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<ProfileViewDetailed>;
  findPosts: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<TimelinePostDto[]>;
  findFollowList: (
    did: string,
    actor: AtIdentifierString,
    kind: "follows" | "followers",
  ) => Promise<FollowListDto>;
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
    async findPosts(did, actor) {
      const agent = await restore(did);
      // ponytail: 最初の20件のみ。古い投稿の読み込みはapi.timelineと同様のAPIルートを足すとき
      const { feed } = await agent.call(getAuthorFeed, { actor, limit: 20 });
      return feed.map(toTimelinePost);
    },
    async findFollowList(did, actor, kind) {
      const agent = await restore(did);
      // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const params = { actor, limit: 100 };
      const res =
        kind === "follows"
          ? await agent.call(getFollows, params)
          : await agent.call(getFollowers, params);
      const actors = "follows" in res ? res.follows : res.followers;
      return { subject: toActor(res.subject), actors: actors.map(toActor) };
    },
    async isAdmin(did) {
      const agent = await restore(did);
      const { status } = await agent.call(verifyAccess);
      return status === "authorized";
    },
  };
};
