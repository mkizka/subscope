import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ListsPage } from "@/app/pages/client/lists-page";

import type { Route } from "./+types/$handle_.lists";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta() {
  return [{ title: "リスト - Subscope" }];
}

export default function Lists({ params }: Route.ComponentProps) {
  return <ListsPage handle={params.handle} />;
}
