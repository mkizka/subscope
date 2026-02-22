import { MeSubscoSyncGetSubscriptionStatus } from "@repo/client/api";
import { redirect } from "react-router";

import { AppLayout } from "@/app/components/layout";
import { LoginContainer } from "@/app/features/login/login-container";
import { getAgent } from "@/app/lib/oauth/session.server";

import type { Route } from "./+types/login";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const agent = await getAgent(request);

  if (agent) {
    const response = await agent.me.subsco.sync.getSubscriptionStatus();
    if (!MeSubscoSyncGetSubscriptionStatus.isSubscribed(response.data)) {
      throw redirect("/register");
    }
  }
};

export default function Login() {
  return (
    <AppLayout verticalCenter>
      <LoginContainer />
    </AppLayout>
  );
}
