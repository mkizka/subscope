import { redirect } from "react-router";

import { LoginForm } from "~/components/LoginForm";
import { getSessionAgent } from "~/server/oauth/session";

import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const agent = await getSessionAgent(request);

  if (agent) {
    return redirect("/");
  }

  return null;
}

export default function LoginPage() {
  return <LoginForm />;
}
