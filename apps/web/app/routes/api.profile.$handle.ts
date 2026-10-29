import { isAtIdentifierString } from "@atproto/syntax";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.profile.$handle";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  if (!isAtIdentifierString(params.handle)) {
    throw data("不正なハンドルです", { status: 400 });
  }
  const agent = context.get(agentContext);
  const profile = await agent.call(getProfile, { actor: params.handle });
  return data(profile);
};
