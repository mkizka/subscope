import { data } from "react-router";

import { oauthSession } from "~/server/inject";

import type { Route } from "./+types/bff.[app.bsky.actor.getProfile]";

export async function loader({ request }: Route.LoaderArgs) {
  const agent = await oauthSession.getAgent(request);

  if (!agent) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const actor = url.searchParams.get("actor");

  if (!actor) {
    return data({ error: "Actor parameter is required" }, { status: 400 });
  }

  try {
    const response = await agent.app.bsky.actor.getProfile({
      actor,
    });
    return response.data;
  } catch (error) {
    return data({ error: "Failed to get profile" }, { status: 500 });
  }
}
