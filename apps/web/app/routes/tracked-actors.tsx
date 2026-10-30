import getTrackedActors from "@repo/client/lex/me/subsco/server/getTrackedActors";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { TrackedActorsPage } from "@/app/pages/client/tracked-actors-page";

import type { Route } from "./+types/tracked-actors";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
  const { trackedActors } = await agent.call(getTrackedActors, { limit: 100 });
  return data({
    actors: trackedActors.map(({ profile, subscriberFollowersCount }) => ({
      did: profile.did,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatar,
      subscriberFollowersCount,
    })),
  });
};

export function meta() {
  return [{ title: "追跡中のユーザー - Subscope" }];
}

export default function TrackedActors({ loaderData }: Route.ComponentProps) {
  return <TrackedActorsPage actors={loaderData.actors} />;
}
