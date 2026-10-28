import { me } from "@repo/client/lex";
import { redirect } from "react-router";

import { LoginContainer } from "@/app/features/login/pages/login-container";
import { getAgent } from "@/app/lib/oauth/session.server";

import type { Route } from "./+types/login";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const agent = await getAgent(request);

  if (agent) {
    const response = await agent.call(me.subsco.sync.getSubscriptionStatus);
    if (!me.subsco.sync.getSubscriptionStatus.subscribed.isTypeOf(response)) {
      throw redirect("/register");
    }
  }
};

export default function Login() {
  return <LoginContainer />;
}
