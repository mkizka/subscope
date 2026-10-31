import { parseWithZod } from "@conform-to/zod/v4";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { searchSchema } from "@/app/features/search/blocks/search-form-container";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { SearchPage } from "@/app/pages/client/search-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/search";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const submission = parseWithZod(new URL(request.url).searchParams, {
    schema: searchSchema,
  });
  const q = submission.status === "success" ? submission.value.q : undefined;
  return data({
    q,
    actors: q
      ? await di.searchActorsUseCase.execute(context.get(didContext), q)
      : [],
  });
};

export function meta() {
  return [{ title: "検索 - Subscope" }];
}

export default function Search({ loaderData }: Route.ComponentProps) {
  return <SearchPage {...loaderData} />;
}
