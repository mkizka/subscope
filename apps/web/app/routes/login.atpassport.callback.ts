import { redirect } from "react-router";

import { di } from "@/app/server/di";

import type { Route } from "./+types/login.atpassport.callback";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const handle = await di.atPassport.finish(
    request.url,
    request.headers.get("Cookie"),
  );
  if (!handle) {
    return redirect("/login");
  }
  try {
    return redirect(await di.oauthClient.authorize(handle));
  } catch {
    return redirect("/login?error=auth_failed");
  }
};
