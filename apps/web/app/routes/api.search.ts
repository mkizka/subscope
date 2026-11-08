import { parseWithZod } from "@conform-to/zod/v4";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { searchSchema } from "@/app/features/search/blocks/search-form-container";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.search";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const submission = parseWithZod(new URL(request.url).searchParams, {
    schema: searchSchema,
  });
  const { q, tab = "posts" as const } =
    submission.status === "success" ? submission.value : {};
  return data(
    q
      ? await di.searchUseCase.execute(context.get(didContext), q, tab)
      : { accounts: [], posts: [] },
  );
};
