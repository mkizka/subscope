import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { TrackedActorsPage } from "@/app/pages/client/tracked-actors-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/tracked-actors";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  return data(
    await di.getTrackedActorsUseCase.execute(context.get(didContext)),
  );
};

export function meta() {
  return [{ title: "追跡中のユーザー - Subscope" }];
}

export default function TrackedActors({ loaderData }: Route.ComponentProps) {
  return (
    <TrackedActorsPage actors={loaderData.actors} total={loaderData.total} />
  );
}
