import { redirect } from "react-router";

import { expressContext } from "@/app/context/express";
import { oauthClient } from "@/app/lib/oauth/client.server";
import {
  commitSession,
  createAgent,
  getSession,
} from "@/app/lib/oauth/session.server";

import type { Route } from "./+types/oauth.callback";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const { injected } = context.get(expressContext);
  const logger = injected.loggerManager.createLogger("oauth.callback");

  let oauthSession;
  try {
    const url = new URL(request.url);
    const callbackResult = await oauthClient.callback(url.searchParams);
    oauthSession = callbackResult.session;
  } catch (e) {
    logger.error(e, "OAuth callback failed");
    return redirect("/?error=oauth_callback_failed");
  }

  const agent = createAgent(oauthSession);
  let response;
  try {
    response = await agent.me.subsco.server.getSetupStatus();
  } catch {
    logger.error("Failed to check server setup status");
    return redirect("/?error=setup_status_check_failed");
  }

  try {
    if (!response.data.initialized) {
      await agent.me.subsco.admin.registerAdmin();
      await agent.me.subsco.sync.subscribeServer();
    }
  } catch (e) {
    logger.error(e, "Admin registration or server subscription failed");
    return redirect("/?error=admin_registration_or_subscription_failed");
  }

  const cookieSession = await getSession(request);
  cookieSession.set("did", oauthSession.did);
  return redirect("/register", {
    headers: {
      "Set-Cookie": await commitSession(cookieSession),
    },
  });
};
