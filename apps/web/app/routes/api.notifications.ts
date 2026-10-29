import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import listNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.notifications";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  const { notifications } = await agent.call(listNotifications, { limit: 25 });
  const subjectUris = [
    ...new Set(
      notifications.flatMap((notification) =>
        notification.reasonSubject ? [notification.reasonSubject] : [],
      ),
    ),
  ];
  const { posts } =
    subjectUris.length > 0
      ? await agent.call(getPosts, { uris: subjectUris })
      : { posts: [] };
  const subjectTexts = new Map(
    posts.map((post) => [post.uri, post.record.text]),
  );
  return data({
    notifications: notifications.map((notification) => {
      const subjectText =
        notification.reasonSubject &&
        subjectTexts.get(notification.reasonSubject);
      return {
        uri: notification.uri,
        authorName:
          notification.author.displayName ?? notification.author.handle,
        reason: notification.reason,
        subjectText: typeof subjectText === "string" ? subjectText : undefined,
      };
    }),
  });
};
