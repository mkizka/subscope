import { redirect } from "react-router";

import { destroySession, getSession } from "~/server/oauth/session";

import type { Route } from "./+types/oauth.logout";

export const action = async ({ request }: Route.ActionArgs) => {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};
