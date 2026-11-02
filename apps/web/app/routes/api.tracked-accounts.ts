import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.tracked-accounts";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const q = new URL(request.url).searchParams.get("q") || undefined;
  return data(
    await di.getTrackedAccountsUseCase.execute(context.get(didContext), q),
  );
};
