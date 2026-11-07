import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ServerPage } from "@/app/pages/client/server-page";

import type { Route } from "./+types/server._index";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta() {
  return [{ title: "サーバーについて - Subscope" }];
}

export default function Server() {
  return <ServerPage />;
}
