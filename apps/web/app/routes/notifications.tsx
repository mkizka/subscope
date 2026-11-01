import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { NotificationsPage } from "@/app/pages/client/notifications-page";

import type { Route } from "./+types/notifications";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta() {
  return [{ title: "通知 - Subscope" }];
}

export default function Notifications() {
  return <NotificationsPage />;
}
