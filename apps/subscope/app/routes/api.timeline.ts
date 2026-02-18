/* eslint-disable no-console */
import { ResponseType, XRPCError } from "@atproto/xrpc";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.timeline";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    console.time("[api.timeline] getTimeline");
    const response = await agent.app.bsky.feed.getTimeline({
      limit: 20,
      cursor,
    });
    console.timeEnd("[api.timeline] getTimeline");
    return data(response.data);
  } catch (e) {
    if (
      e instanceof XRPCError &&
      (e.status === ResponseType.AuthenticationRequired ||
        e.status === ResponseType.Forbidden)
    ) {
      throw data({ error: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }
};
