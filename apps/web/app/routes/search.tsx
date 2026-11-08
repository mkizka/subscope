import { parseWithZod } from "@conform-to/zod/v4";
import { useSearchParams } from "react-router";

import { searchSchema } from "@/app/features/search/blocks/search-form-container";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { SearchPage } from "@/app/pages/client/search-page";

import type { Route } from "./+types/search";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta() {
  return [{ title: "検索 - Subscope" }];
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const submission = parseWithZod(searchParams, { schema: searchSchema });
  const { q, tab = "posts" as const } =
    submission.status === "success" ? submission.value : {};
  return <SearchPage q={q} tab={tab} />;
}
