import { redirect } from "react-router";

import { oauthClient } from "@/app/lib/oauth/client.server";
import {
  commitSession,
  createAgent,
  getSession,
} from "@/app/lib/oauth/session.server";

import type { Route } from "./+types/oauth.callback";

// TODO: エラー箇所事に処理を分岐させる
// TODO: loggerを受け取るようにする
export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const url = new URL(request.url);
    const { session } = await oauthClient.callback(url.searchParams);
    const cookieSession = await getSession(request);
    cookieSession.set("did", session.did);

    const agent = createAgent(session);
    const { data } = await agent.me.subsco.admin.verifyAccess();
    if (data.status === "needsSetup") {
      await agent.me.subsco.admin.registerAdmin();
    }

    return redirect("/register", {
      headers: {
        "Set-Cookie": await commitSession(cookieSession),
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("OAuth callback error:", e);
    return redirect("/login?error=callback_failed");
  }
};
