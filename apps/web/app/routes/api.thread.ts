import { isAtUriString } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.thread";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const uri = new URL(request.url).searchParams.get("uri");
  if (!isAtUriString(uri)) {
    throw data("不正なURIです", { status: 400 });
  }
  return data(await di.getThreadUseCase.execute(context.get(didContext), uri));
};
