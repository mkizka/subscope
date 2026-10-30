import registerAdmin from "@repo/client/lex/me/subsco/admin/registerAdmin";
import getSetupStatus from "@repo/client/lex/me/subsco/server/getSetupStatus";
import { redirect } from "react-router";

import { di } from "@/app/server/di";

import type { Route } from "./+types/oauth.callback";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const logger = di.loggerManager.createLogger("oauth.callback");

  let agent;
  try {
    agent = await di.oauthClient.callback(new URL(request.url).searchParams);
  } catch (e) {
    logger.error(e, "OAuth callback failed");
    return redirect("/?error=oauth_callback_failed");
  }

  let response;
  try {
    response = await agent.call(getSetupStatus);
  } catch (e) {
    logger.error(e, "Failed to check server setup status");
    return redirect("/?error=setup_status_check_failed");
  }

  try {
    if (!response.initialized) {
      await agent.call(registerAdmin);
    }
  } catch (e) {
    logger.error(e, "Admin registration failed");
    return redirect("/?error=admin_registration_failed");
  }

  return redirect("/login", {
    headers: {
      "Set-Cookie": await di.cookieSessionStorage.commit(
        request.headers.get("Cookie"),
        agent.assertDid,
      ),
    },
  });
};
