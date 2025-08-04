import { SubscoAgent } from "@repo/client/api";
import { redirect } from "react-router";

import { env } from "~/server/env";
import { injector } from "~/server/injector";
import { oauthClient } from "~/server/oauth/client";
import { getSessionUserDid } from "~/server/oauth/session";

import type { Route } from "./+types/bff.[me.subsco.admin.createInviteCode]";

const loggerManager = injector.resolve("loggerManager");
const logger = loggerManager.createLogger("bff.createInviteCode");

export async function action({ request }: Route.ActionArgs) {
  const userDid = await getSessionUserDid(request);
  if (!userDid) {
    return redirect("/login");
  }

  try {
    const oauthSession = await oauthClient.restore(userDid);
    const agent = new SubscoAgent({
      sessionManager: oauthSession,
      atprotoProxy: env.ATPROTO_PROXY,
    });

    const response = await agent.me.subsco.admin.createInviteCode({
      daysToExpire: 30,
    });

    return { inviteCode: response.data.code };
  } catch (error) {
    logger.error(error, "Failed to create invite code");
    return { error: "Failed to create invite code" };
  }
}
