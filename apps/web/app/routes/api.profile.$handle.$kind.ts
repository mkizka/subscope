import { isAtIdentifierString } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.profile.$handle.$kind";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({
  params,
  request,
  context,
}: Route.LoaderArgs) => {
  const { handle, kind } = params;
  if (
    !isAtIdentifierString(handle) ||
    (kind !== "follows" && kind !== "followers")
  ) {
    throw data("ページが見つかりません", { status: 404 });
  }
  return data(
    await di.getFollowListUseCase.execute(
      context.get(didContext),
      handle,
      kind,
      new URL(request.url).searchParams.get("filter") === "registered"
        ? "registered"
        : undefined,
    ),
  );
};
