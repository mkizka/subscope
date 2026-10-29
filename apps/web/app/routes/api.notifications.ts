import listNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.notifications";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  const response = await agent.call(listNotifications, { limit: 30 });
  return data(response);
};
