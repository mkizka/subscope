import { redirect } from "react-router";

import { loggerManager } from "@/app/lib/logger.server";
import { oauthClient } from "@/app/lib/oauth/client.server";
import {
  commitSession,
  createAgent,
  getSession,
} from "@/app/lib/oauth/session.server";

import type { Route } from "./+types/oauth.callback";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const logger = loggerManager.createLogger("oauth.callback");

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
  } catch (e) {
    logger.error(e, "Failed to check server setup status");
    return redirect("/?error=setup_status_check_failed");
  }

  try {
    if (!response.data.initialized) {
      await agent.me.subsco.admin.registerAdmin();
    }
  } catch (e) {
    logger.error(e, "Admin registration failed");
    return redirect("/?error=admin_registration_failed");
  }

  const cookieSession = await getSession(request);
  cookieSession.set("did", oauthSession.did);
  return redirect("/register", {
    headers: {
      "Set-Cookie": await commitSession(cookieSession),
    },
  });
};
