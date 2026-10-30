import { isAtIdentifierString } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ProfilePage } from "@/app/pages/client/profile-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/profile.$handle";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  if (!isAtIdentifierString(params.handle)) {
    throw data("ユーザーが見つかりません", { status: 404 });
  }
  return data(
    await di.getProfilePageUseCase.execute(
      context.get(didContext),
      params.handle,
    ),
  );
};

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `@${loaderData.profile.handle} - Subscope` }];
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { profile, isSelf, posts } = loaderData;
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
      posts={posts}
    />
  );
}
