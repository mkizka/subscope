import { isAtIdentifierString } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ProfilePage } from "@/app/pages/client/profile-page";
import { di } from "@/app/server/di";
import type { ProfileTab } from "@/app/server/infrastructure/actor/actor-query";

import type { Route } from "./+types/profile.$handle";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

const toTab = (value: string | null): ProfileTab =>
  value === "replies" || value === "media" || value === "likes"
    ? value
    : "posts";

export const loader = async ({
  params,
  request,
  context,
}: Route.LoaderArgs) => {
  if (!isAtIdentifierString(params.handle)) {
    throw data("ユーザーが見つかりません", { status: 404 });
  }
  return data(
    await di.getProfilePageUseCase.execute(
      context.get(didContext),
      params.handle,
      toTab(new URL(request.url).searchParams.get("tab")),
    ),
  );
};

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `@${loaderData.profile.handle} - Subscope` }];
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { profile, isSelf, posts, tab } = loaderData;
  return (
    <ProfilePage
      displayName={profile.displayName}
      handle={profile.handle}
      avatarUrl={profile.avatar}
      bannerUrl={profile.banner}
      description={profile.description}
      followsCount={profile.followsCount ?? 0}
      followersCount={profile.followersCount ?? 0}
      follow={
        isSelf
          ? undefined
          : { did: profile.did, viewerFollowing: profile.viewer?.following }
      }
      tabs={
        isSelf
          ? ["posts", "replies", "media", "likes"]
          : ["posts", "replies", "media"]
      }
      tab={tab}
      posts={posts}
    />
  );
}
