import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.quotes";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const params = new URL(request.url).searchParams;
  const quotes = await di.getQuotesUseCase
    .execute(
      context.get(didContext),
      `at://${params.get("handle")}/app.bsky.feed.post/${params.get("rkey")}`,
      params.get("cursor") ?? undefined,
    )
    .catch(() => null);
  if (!quotes) {
    throw data("引用の取得に失敗しました", { status: 500 });
  }
  return data(quotes);
};
