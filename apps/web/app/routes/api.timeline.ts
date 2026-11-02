import { data, redirect } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.timeline";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  const timeline = await di.getTimelineUseCase
    .execute(context.get(didContext), cursor)
    .catch((e: unknown) => {
      di.loggerManager
        .createLogger("api.timeline")
        .error(e, "Failed to get timeline");
      throw data("タイムラインの取得に失敗しました", { status: 500 });
    });
  if (!timeline) {
    throw redirect("/login");
  }
  return data(timeline);
};
