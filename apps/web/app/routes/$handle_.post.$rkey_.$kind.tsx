import { data } from "react-router";

import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ReactorsPage } from "@/app/pages/client/reactors-page";

import type { Route } from "./+types/$handle_.post.$rkey_.$kind";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

const titles = { "liked-by": "いいね", "reposted-by": "リポスト" };

export function meta({ params }: Route.MetaArgs) {
  const title =
    params.kind === "liked-by" ? titles["liked-by"] : titles["reposted-by"];
  return [{ title: `${title} - Subscope` }];
}

export default function Reactors({ params }: Route.ComponentProps) {
  const { handle, rkey, kind } = params;
  if (kind !== "liked-by" && kind !== "reposted-by") {
    throw data("ページが見つかりません", { status: 404 });
  }
  return <ReactorsPage handle={handle} rkey={rkey} kind={kind} />;
}
