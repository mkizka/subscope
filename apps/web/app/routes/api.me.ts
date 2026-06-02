import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.me";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  const profile = await agent.app.bsky.actor.getProfile({
    actor: agent.did,
  });
  return data({
    avatarUrl: profile.data.avatar,
    handle: profile.data.handle,
  });
};
