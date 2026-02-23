import { ResponseType, XRPCError } from "@atproto/xrpc";
// eslint-disable-next-line unused-imports/no-unused-imports
import type * as _ from "@repo/client/api";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";

import type { Route } from "./+types/admin.api.subscribers";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const response = await agent.me.subsco.admin.getSubscribers({
      limit: 20,
      cursor,
    });
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
