import { AtUri } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.quotes";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const params = new URL(request.url).searchParams;
  const quotes = await Promise.resolve()
    .then(() =>
      di.getQuotesUseCase.execute(
        context.get(didContext),
        AtUri.make(
          params.get("handle") ?? "",
          "app.bsky.feed.post",
          params.get("rkey") ?? "",
        ).toString(),
        params.get("cursor") ?? undefined,
      ),
    )
    .catch(() => null);
  if (!quotes) {
    throw data("引用の取得に失敗しました", { status: 500 });
  }
  return data(quotes);
};
