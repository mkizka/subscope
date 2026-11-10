import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { SearchPage } from "@/app/pages/client/search-page";

import type { Route } from "./+types/search";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta() {
  return [{ title: "検索 - Subscope" }];
}

export default function Search() {
  return <SearchPage />;
}
