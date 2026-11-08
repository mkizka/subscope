import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.search-typeahead";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const q = new URL(request.url).searchParams.get("q");
  return data(
    q
      ? await di.accountQuery.searchActorsTypeahead(context.get(didContext), q)
      : [],
  );
};
