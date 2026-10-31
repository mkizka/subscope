import { isAtIdentifierString } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ListsPage } from "@/app/pages/client/lists-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/profile.$handle_.lists";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  if (!isAtIdentifierString(params.handle)) {
    throw data("ユーザーが見つかりません", { status: 404 });
  }
  return data({
    lists: await di.getListsPageUseCase.execute(
      context.get(didContext),
      params.handle,
    ),
  });
};

export function meta() {
  return [{ title: "リスト - Subscope" }];
}

export default function Lists({ loaderData }: Route.ComponentProps) {
  return <ListsPage {...loaderData} />;
}
