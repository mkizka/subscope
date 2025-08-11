import { redirect } from "react-router";

import { injector } from "~/server/injector";
import { getSessionAgent } from "~/server/oauth/session";

import type { Route } from "./+types/bff.[me.subsco.admin.createInviteCode]";

const loggerManager = injector.resolve("loggerManager");
const logger = loggerManager.createLogger("bff.createInviteCode");

export async function action({ request }: Route.ActionArgs) {
  const agent = await getSessionAgent(request);
  if (!agent) {
    return redirect("/login");
  }

  try {
    const response = await agent.me.subsco.admin.createInviteCode({
      daysToExpire: 30,
    });
    return { inviteCode: response.data.code };
  } catch (error) {
    logger.error(error, "Failed to create invite code");
    return { error: "Failed to create invite code" };
  }
}
