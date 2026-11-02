import { redirect } from "react-router";

import { di } from "@/app/server/di";

import type { Route } from "./+types/oauth.logout";

export const action = async ({ request }: Route.ActionArgs) => {
  return redirect("/login", {
    headers: {
      "Set-Cookie": await di.cookieSessionStorage.destroy(
        request.headers.get("Cookie"),
      ),
    },
  });
};
