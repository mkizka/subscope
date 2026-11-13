import { isAtIdentifierString } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import type { ProfileTab } from "@/app/server/application/dto/account";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.profile.$handle";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

const toTab = (value: string | null): ProfileTab =>
  value === "replies" ||
  value === "media" ||
  value === "video" ||
  value === "likes"
    ? value
    : "posts";

export const loader = async ({
  params,
  request,
  context,
}: Route.LoaderArgs) => {
  if (!isAtIdentifierString(params.handle)) {
    throw data("ユーザーが見つかりません", { status: 404 });
  }
  const searchParams = new URL(request.url).searchParams;
  return data(
    await di.getProfilePageUseCase.execute(
      context.get(didContext),
      params.handle,
      toTab(searchParams.get("tab")),
      searchParams.get("cursor") ?? undefined,
    ),
  );
};
