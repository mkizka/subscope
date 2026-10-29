import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import verifyAccess from "@repo/client/lex/me/subsco/admin/verifyAccess";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.me";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  const [profile, access] = await Promise.all([
    agent.call(getProfile, { actor: agent.assertDid }).catch(() => undefined),
    agent.call(verifyAccess),
  ]);
  return data({
    did: agent.assertDid,
    avatarUrl: profile?.avatar,
    handle: profile?.handle,
    isAdmin: access.status === "authorized",
  });
};
