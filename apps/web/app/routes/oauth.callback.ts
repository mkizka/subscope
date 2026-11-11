import { redirect } from "react-router";

import { di } from "@/app/server/di";

import type { Route } from "./+types/oauth.callback";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const result = await di.oauthCallbackUseCase.execute(
    new URL(request.url).searchParams,
  );
  if ("error" in result) {
    return redirect(`/?error=${result.error}`);
  }
  return redirect(
    result.invalidInviteCode ? "/login?error=invalid_invite_code" : "/login",
    {
      headers: {
        "Set-Cookie": await di.cookieSessionStorage.commit(
          request.headers.get("Cookie"),
          result.did,
        ),
      },
    },
  );
};
