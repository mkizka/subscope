import { redirect } from "react-router";

import { InviteCodeContainer } from "~/features/invite-code/container";
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

export default function Page() {
  return <InviteCodeContainer />;
}
