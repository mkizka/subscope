import { redirect } from "react-router";

import { oauthSession } from "~/server/inject";

import type { Route } from "./+types/oauth.logout";

export const action = async ({ request }: Route.ActionArgs) => {
  const session = await oauthSession.getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await oauthSession.destroySession(session),
    },
  });
};
