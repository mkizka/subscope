import { redirect } from "react-router";

import { LoginForm } from "~/components/LoginForm";
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
  return <LoginForm />;
}
