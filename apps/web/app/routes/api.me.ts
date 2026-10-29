import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.me";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  const profile = await agent.call(getProfile, {
    actor: agent.assertDid,
  });
  return data({
    did: profile.did,
    avatarUrl: profile.avatar,
    handle: profile.handle,
  });
};
