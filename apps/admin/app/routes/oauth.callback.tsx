import { redirect } from "react-router";

import { loggerManager, oauthClient, oauthSession } from "~/server/inject";

import type { Route } from "./+types/oauth.callback";
const logger = loggerManager.createLogger("oauth.callback");

export async function loader({ request }: Route.LoaderArgs) {
  const remixSession = await oauthSession.getSession(
    request.headers.get("Cookie"),
  );
  try {
    const { session } = await oauthClient.callback(
      new URL(request.url).searchParams,
    );
    remixSession.set("did", session.did);
    return redirect("/", {
      headers: {
        "Set-Cookie": await oauthSession.commitSession(remixSession),
      },
    });
  } catch (error) {
    logger.error(error, "OAuthコールバックに失敗しました");
    return redirect("/login");
  }
}
