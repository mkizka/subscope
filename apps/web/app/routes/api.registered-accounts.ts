import { data } from "react-router";

import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.registered-accounts";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const q = new URL(request.url).searchParams.get("q") || undefined;
  return data(await di.getServerMembersUseCase.execute(q));
};
