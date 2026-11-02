import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { TrackedAccountsPage } from "@/app/pages/client/tracked-accounts-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/tracked-accounts";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  return data(
    await di.getTrackedAccountsUseCase.execute(context.get(didContext)),
  );
};

export function meta() {
  return [{ title: "追跡アカウント - Subscope" }];
}

export default function TrackedAccounts({ loaderData }: Route.ComponentProps) {
  return (
    <TrackedAccountsPage actors={loaderData.actors} total={loaderData.total} />
  );
}
