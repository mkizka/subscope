import { asDatetimeString } from "@atproto/syntax";
import listNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";
import updateSeen from "@repo/client/lex/app/bsky/notification/updateSeen";
import { data } from "react-router";
import { z } from "zodV4";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.notifications";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  const response = await agent.call(listNotifications, { limit: 30 });
  return data(response);
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const agent = context.get(agentContext);
  const { seenAt } = z
    .object({ seenAt: z.string().transform(asDatetimeString) })
    .parse(await request.json());
  await agent.call(updateSeen, { seenAt });
  return data({ success: true });
};
