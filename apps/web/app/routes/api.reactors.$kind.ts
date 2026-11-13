import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.reactors.$kind";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({
  params,
  request,
  context,
}: Route.LoaderArgs) => {
  const { kind } = params;
  if (kind !== "liked-by" && kind !== "reposted-by") {
    throw data("ページが見つかりません", { status: 404 });
  }
  const searchParams = new URL(request.url).searchParams;
  const accounts = await di.getReactorsUseCase
    .execute(
      context.get(didContext),
      `at://${searchParams.get("handle")}/app.bsky.feed.post/${searchParams.get("rkey")}`,
      kind,
      searchParams.get("cursor") ?? undefined,
    )
    .catch(() => null);
  if (!accounts) {
    throw data("一覧の取得に失敗しました", { status: 500 });
  }
  return data(accounts);
};
