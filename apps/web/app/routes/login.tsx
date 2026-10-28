import getSubscriptionStatus, {
  subscribed,
} from "@repo/client/lex/me/subsco/sync/getSubscriptionStatus";
import { redirect } from "react-router";

import { LoginContainer } from "@/app/features/login/pages/login-container";
import { getAgent } from "@/app/lib/oauth/session.server";

import type { Route } from "./+types/login";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const agent = await getAgent(request);

  if (agent) {
    const response = await agent.call(getSubscriptionStatus);
    if (!subscribed.isTypeOf(response)) {
      throw redirect("/register");
    }
  }
};

export default function Login() {
  return <LoginContainer />;
}
