import getUnreadCount from "@repo/client/lex/app/bsky/notification/getUnreadCount";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.notifications.unread-count";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  const response = await agent.call(getUnreadCount, {});
  return data(response);
};
