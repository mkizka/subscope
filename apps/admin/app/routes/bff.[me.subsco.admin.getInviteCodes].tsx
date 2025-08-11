import { data } from "react-router";

import { getSessionAgent } from "~/server/oauth/session";

import type { Route } from "./+types/bff.[me.subsco.admin.getInviteCodes]";

export async function loader({ request }: Route.LoaderArgs) {
  const agent = await getSessionAgent(request);

  if (!agent) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;

  try {
    const response = await agent.me.subsco.admin.getInviteCodes({
      cursor,
      limit: 5,
    });
    return response.data;
  } catch (error) {
    return data({ error: "Failed to get invite codes" }, { status: 500 });
  }
}
