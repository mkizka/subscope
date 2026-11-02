import { data } from "react-router";

import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { FollowListPage } from "@/app/pages/client/follow-list-page";

import type { Route } from "./+types/profile.$handle_.$kind";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

const titles = { follows: "フォロー", followers: "フォロワー" };

export function meta({ params }: Route.MetaArgs) {
  const title = titles[params.kind === "followers" ? "followers" : "follows"];
  return [{ title: `${title} @${params.handle} - Subscope` }];
}

export default function FollowList({ params }: Route.ComponentProps) {
  const { handle, kind } = params;
  if (kind !== "follows" && kind !== "followers") {
    throw data("ページが見つかりません", { status: 404 });
  }
  return <FollowListPage handle={handle} kind={kind} />;
}
