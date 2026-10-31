import { isAtIdentifierString } from "@atproto/syntax";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ListPage } from "@/app/pages/client/list-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/profile.$handle_.lists_.$rkey";

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
  const result = await di.getListPageUseCase.execute(
    context.get(didContext),
    params.handle,
    params.rkey,
    tab,
  );
  return data({ ...result, tab });
};

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData.list.name} - Subscope` }];
}

export default function List({ loaderData }: Route.ComponentProps) {
  const { list, ...rest } = loaderData;
  return <ListPage name={list.name} description={list.description} {...rest} />;
}
