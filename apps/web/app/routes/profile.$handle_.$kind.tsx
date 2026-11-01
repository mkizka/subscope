import { isAtIdentifierString } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { FollowListPage } from "@/app/pages/client/follow-list-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/profile.$handle_.$kind";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

const titles = { follows: "フォロー", followers: "フォロワー" };

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const { handle, kind } = params;
  if (
    !isAtIdentifierString(handle) ||
    (kind !== "follows" && kind !== "followers")
  ) {
    throw data("ページが見つかりません", { status: 404 });
  }
  const list = await di.getFollowListUseCase.execute(
    context.get(didContext),
    handle,
    kind,
  );
  return data({ ...list, title: titles[kind] });
};

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `${loaderData.title} @${loaderData.subject.handle} - Subscope` },
  ];
}

export default function FollowList({ loaderData }: Route.ComponentProps) {
  return <FollowListPage {...loaderData} />;
}
