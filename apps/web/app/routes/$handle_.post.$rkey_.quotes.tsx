import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { QuotesPage } from "@/app/pages/client/quotes-page";

import type { Route } from "./+types/$handle_.post.$rkey_.quotes";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta() {
  return [{ title: "引用 - Subscope" }];
}

export default function Quotes({ params }: Route.ComponentProps) {
  return <QuotesPage handle={params.handle} rkey={params.rkey} />;
}
