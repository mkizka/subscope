import { redirect } from "react-router";

import { oauthSession } from "~/server/inject";

import type { Route } from "./+types/_index";

export async function loader({ request }: Route.LoaderArgs) {
  const agent = await oauthSession.getAgent(request);

  if (!agent) {
    return redirect("/login");
  }

  return {
    userDid: agent.did,
  };
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return <div className="grid grid-cols-2 gap-2">サブスクライバー一覧</div>;
}
