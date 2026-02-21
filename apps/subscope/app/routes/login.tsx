import { MeSubscoSyncGetSubscriptionStatus } from "@repo/client/api";
import { redirect } from "react-router";

import { AppLayout } from "@/app/components/layout";
import { expressContext } from "@/app/context/express";
import { LoginContainer } from "@/app/features/login/login-container";

import type { Route } from "./+types/login";

export const loader = async ({ context }: Route.LoaderArgs) => {
  const server = context.get(expressContext);

  if (server.agent) {
    const response = await server.agent.me.subsco.sync.getSubscriptionStatus();
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
