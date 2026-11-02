import { isAtIdentifierString } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.lists.$handle";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  if (!isAtIdentifierString(params.handle)) {
    throw data("ユーザーが見つかりません", { status: 404 });
  }
  return data(
    await di.getListsPageUseCase.execute(
      context.get(didContext),
      params.handle,
    ),
  );
};
