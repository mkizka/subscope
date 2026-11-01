import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ThreadPage } from "@/app/pages/client/thread-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/profile.$handle_.post.$rkey";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const thread = await di.getThreadUseCase
    .execute(
      context.get(didContext),
      `at://${params.handle}/app.bsky.feed.post/${params.rkey}`,
    )
    .catch(() => null);
  if (!thread) {
    throw data("投稿が見つかりません", { status: 404 });
  }
  return data(thread);
};

export function meta() {
  return [{ title: "スレッド - Subscope" }];
}

export default function Thread({ loaderData }: Route.ComponentProps) {
  return <ThreadPage thread={loaderData} />;
}
