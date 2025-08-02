import { redirect } from "react-router";

import { injector } from "~/server/injector";
import { oauthClient } from "~/server/oauth/client";
import { commitSession, getSession } from "~/server/oauth/session";

import type { Route } from "./+types/oauth-callback";

const loggerManager = injector.resolve("loggerManager");
const logger = loggerManager.createLogger("oauth-callback");

export async function loader({ request }: Route.LoaderArgs) {
  const remixSession = await getSession(request);
  try {
    const { session: oauthSession } = await oauthClient.callback(
      new URL(request.url).searchParams,
    );
    remixSession.set("did", oauthSession.did);
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(remixSession),
      },
    });
  } catch (error) {
    logger.error(error, "OAuthコールバックに失敗しました");
    return redirect("/login");
  }
}
