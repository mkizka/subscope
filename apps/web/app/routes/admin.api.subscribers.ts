import { XrpcResponseError } from "@atproto/lex";
import getSubscribers from "@repo/client/lex/me/subsco/admin/getSubscribers";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";

import type { Route } from "./+types/admin.api.subscribers";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const response = await agent.call(getSubscribers, {
      limit: 20,
      cursor,
    });
    return data(response);
  } catch (e) {
    if (
      e instanceof XrpcResponseError &&
      (e.status === 401 || e.status === 403)
    ) {
      throw data({ error: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }
};
