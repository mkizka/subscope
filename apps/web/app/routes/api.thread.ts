import { isAtUriString } from "@atproto/syntax";
import {
  type ThreadViewPost,
  threadViewPost,
} from "@repo/client/lex/app/bsky/feed/defs";
import getPostThread from "@repo/client/lex/app/bsky/feed/getPostThread";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import { toTimelinePost } from "./_index";
import type { Route } from "./+types/api.thread";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const uri = new URL(request.url).searchParams.get("uri");
  if (!isAtUriString(uri)) {
    throw data("不正なURIです", { status: 400 });
  }
  const agent = context.get(agentContext);
  const { thread } = await agent.call(getPostThread, { uri });
  if (!threadViewPost.matches(thread)) {
    return data([]);
  }
  const ancestors: ThreadViewPost[] = [];
  for (let p = thread.parent; threadViewPost.matches(p); p = p.parent) {
    ancestors.unshift(p);
  }
  const replies = (thread.replies ?? []).filter((r) =>
    threadViewPost.matches(r),
  );
  return data(
    [...ancestors, thread, ...replies].map(({ post }) =>
      toTimelinePost({ post }),
    ),
  );
};
