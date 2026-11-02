import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.thread";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const params = new URL(request.url).searchParams;
  const thread = await di.getThreadUseCase
    .execute(
      context.get(didContext),
      `at://${params.get("handle")}/app.bsky.feed.post/${params.get("rkey")}`,
    )
    .catch(() => null);
  if (!thread) {
    throw data("投稿が見つかりません", { status: 404 });
  }
  return data(thread);
};
