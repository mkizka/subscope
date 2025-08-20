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

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">ホーム</h1>
          <p className="text-base-content/60 mt-2">
            ログイン済み: {loaderData.userDid}
          </p>
        </div>
      </div>
    </div>
  );
}
