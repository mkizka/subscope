import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import listNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.notifications";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  const { notifications, cursor: nextCursor } = await agent.call(
    listNotifications,
    { limit: 25, cursor },
  );
  const subjectUris = [
    ...new Set(
      notifications.flatMap((notification) =>
        ["like", "repost"].includes(notification.reason) &&
        notification.reasonSubject
          ? [notification.reasonSubject]
          : [],
      ),
    ),
  ];
  const { posts } =
    subjectUris.length > 0
      ? await agent.call(getPosts, { uris: subjectUris })
      : { posts: [] };
  return data({
    notifications,
    cursor: nextCursor,
    subjectTexts: Object.fromEntries(
      posts.map((post) => [post.uri, post.record.text]),
    ),
  });
};
