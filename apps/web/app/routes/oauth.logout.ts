import { redirect } from "react-router";

import { services } from "@/app/server";

import type { Route } from "./+types/oauth.logout";

export const action = async ({ request }: Route.ActionArgs) => {
  return redirect("/", {
    headers: {
      "Set-Cookie": await services.cookieSession.destroy(request),
    },
  });
};
