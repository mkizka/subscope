import { asDatetimeString } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import listNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";
import updateSeen from "@repo/client/lex/app/bsky/notification/updateSeen";
import { data } from "react-router";
import { z } from "zodV4";

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
    subjectTexts: Object.fromEntries(
      posts.map((post) => [post.uri, post.record.text]),
    ),
  });
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const agent = context.get(agentContext);
  const { seenAt } = z
    .object({ seenAt: z.string().transform(asDatetimeString) })
    .parse(await request.json());
  await agent.call(updateSeen, { seenAt });
  return data({ success: true });
};
