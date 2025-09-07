import { redirect } from "react-router";

import { LoginContainer } from "~/features/login/container";
import { oauthSession } from "~/server/inject";

import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const agent = await oauthSession.getAgent(request);

  if (agent) {
    return redirect("/");
  }

  return null;
}

export default function LoginPage() {
  return <LoginContainer />;
}
