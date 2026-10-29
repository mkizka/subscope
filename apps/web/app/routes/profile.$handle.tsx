import { isAtIdentifierString } from "@atproto/syntax";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import getAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { ProfilePage } from "@/app/features/profile/pages/profile";
import { toTimelinePost } from "@/app/features/timeline/blocks/timeline-feed-container";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/profile.$handle";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  if (!isAtIdentifierString(params.handle)) {
    throw data("ユーザーが見つかりません", { status: 404 });
  }
  const agent = context.get(agentContext);
  // ponytail: 最初の20件のみ。古い投稿の読み込みはapi.timelineと同様のAPIルートを足すとき
  const [profile, authorFeed] = await Promise.all([
    agent.call(getProfile, { actor: params.handle }),
    agent.call(getAuthorFeed, { actor: params.handle, limit: 20 }),
  ]);
  return data({ profile, posts: authorFeed.feed.map(toTimelinePost) });
};

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `@${loaderData.profile.handle} - Subscope` }];
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { profile, posts } = loaderData;
  return (
    <ProfilePage
      displayName={profile.displayName}
      handle={profile.handle}
      avatarUrl={profile.avatar}
      followsCount={profile.followsCount ?? 0}
      followersCount={profile.followersCount ?? 0}
      posts={posts}
    />
  );
}
