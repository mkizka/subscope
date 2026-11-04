import { type AtIdentifierString, isAtIdentifierString } from "@atproto/syntax";
import type {
  ProfileView,
  ProfileViewDetailed,
} from "@repo/client/lex/app/bsky/actor/defs";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import getProfiles from "@repo/client/lex/app/bsky/actor/getProfiles";
import searchActors from "@repo/client/lex/app/bsky/actor/searchActors";
import type { FeedViewPost } from "@repo/client/lex/app/bsky/feed/defs";
import getActorLikes from "@repo/client/lex/app/bsky/feed/getActorLikes";
import getAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";
import getFollowers from "@repo/client/lex/app/bsky/graph/getFollowers";
import getFollows from "@repo/client/lex/app/bsky/graph/getFollows";
import verifyAccess from "@repo/client/lex/me/subsco/admin/verifyAccess";

import type { BackfillStatus } from "@/app/lib/backfill-status";
import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import {
  type TimelinePostDto,
  toTimelinePost,
} from "@/app/server/infrastructure/timeline/timeline-query";

export type ProfileTab = "posts" | "replies" | "media" | "likes";

const filters = {
  posts: "posts_and_author_threads",
  replies: "posts_with_replies",
  media: "posts_with_media",
} as const;

export type AccountDto = {
  did: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  description?: string;
  backfillStatus?: BackfillStatus;
};

export type FollowListDto = {
  subject: AccountDto;
  accounts: AccountDto[];
  registeredCount?: number;
};

const withReplyParents = (feed: FeedViewPost[]) => {
  const seen = new Set(feed.map(({ post }) => post.uri));
  return feed.flatMap((item) => {
    const parent = item.reply?.parent;
    if (!parent || !("record" in parent) || seen.has(parent.uri)) {
      return [toTimelinePost(item)];
    }
    seen.add(parent.uri);
    return [toTimelinePost({ post: parent }), toTimelinePost(item)];
  });
};

const toAccount = (
  profile: Pick<
    ProfileView,
    "did" | "handle" | "displayName" | "avatar" | "description"
  >,
): AccountDto => ({
  did: profile.did,
  handle: profile.handle,
  displayName: profile.displayName,
  avatarUrl: profile.avatar,
  description: profile.description,
});

export interface IAccountQuery {
  findProfile: (
    did: string,
    account: AtIdentifierString,
  ) => Promise<ProfileViewDetailed>;
  findPosts: (
    did: string,
    account: AtIdentifierString,
    tab: ProfileTab,
  ) => Promise<TimelinePostDto[]>;
  findFollowList: (
    did: string,
    account: AtIdentifierString,
    kind: "follows" | "followers",
  ) => Promise<FollowListDto>;
  findProfiles: (did: string, dids: string[]) => Promise<AccountDto[]>;
  isAdmin: (did: string) => Promise<boolean>;
  searchActors: (did: string, q: string) => Promise<AccountDto[]>;
}

export const accountQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IAccountQuery => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("OAuth session not found");
    return agent;
  };
  return {
    async findProfile(did, account) {
      const agent = await restore(did);
      return agent.call(getProfile, { actor: account });
    },
    async findPosts(did, account, tab) {
      const agent = await restore(did);
      // ponytail: 最初の20件のみ。古い投稿の読み込みはapi.timelineと同様のAPIルートを足すとき
      const { feed } =
        tab === "likes"
          ? await agent.call(getActorLikes, { actor: account, limit: 20 })
          : await agent.call(getAuthorFeed, {
              actor: account,
              limit: 20,
              filter: filters[tab],
            });
      return tab === "replies"
        ? withReplyParents(feed)
        : feed.map(toTimelinePost);
    },
    async findFollowList(did, account, kind) {
      const agent = await restore(did);
      // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const params = { actor: account, limit: 100 };
      const res =
        kind === "follows"
          ? await agent.call(getFollows, params)
          : await agent.call(getFollowers, params);
      const accounts = "follows" in res ? res.follows : res.followers;
      return {
        subject: toAccount(res.subject),
        accounts: accounts.map(toAccount),
      };
    },
    async findProfiles(did, dids) {
      const agent = await restore(did);
      const chunks = Array.from(
        { length: Math.ceil(dids.length / 25) },
        (_, i) => dids.slice(i * 25, (i + 1) * 25),
      );
      const results = await Promise.all(
        chunks.map((actors) =>
          agent.call(getProfiles, {
            actors: actors.filter(isAtIdentifierString),
          }),
        ),
      );
      return results.flatMap(({ profiles }) => profiles.map(toAccount));
    },
    async isAdmin(did) {
      const agent = await restore(did);
      const { status } = await agent.call(verifyAccess);
      return status === "authorized";
    },
    async searchActors(did, q) {
      const agent = await restore(did);
      // ponytail: 最初の25件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const { actors: accounts } = await agent.call(searchActors, { q });
      return accounts.map(toAccount);
    },
  };
};
