import { isAtIdentifierString } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.list.$handle.$rkey";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({
  params,
  request,
  context,
}: Route.LoaderArgs) => {
  if (!isAtIdentifierString(params.handle)) {
    throw data("リストが見つかりません", { status: 404 });
  }
  const tab: "posts" | "members" =
    new URL(request.url).searchParams.get("tab") === "members"
      ? "members"
      : "posts";
  return data(
    await di.getListPageUseCase.execute(
      context.get(didContext),
      params.handle,
      params.rkey,
      tab,
    ),
  );
};
