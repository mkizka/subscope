import { isValidDid } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.list-membership.$did";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  if (!isValidDid(params.did)) {
    throw data("ユーザーが見つかりません", { status: 404 });
  }
  return data(
    await di.getListMembershipUseCase.execute(
      context.get(didContext),
      params.did,
    ),
  );
};
