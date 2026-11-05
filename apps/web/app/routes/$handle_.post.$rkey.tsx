import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ThreadPage } from "@/app/pages/client/thread-page";

import type { Route } from "./+types/$handle_.post.$rkey";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta() {
  return [{ title: "スレッド - Subscope" }];
}

export default function Thread({ params }: Route.ComponentProps) {
  return <ThreadPage handle={params.handle} rkey={params.rkey} />;
}
