import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { TrackedAccountsPage } from "@/app/pages/client/tracked-accounts-page";

import type { Route } from "./+types/tracked-accounts";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta() {
  return [{ title: "追跡アカウント - Subscope" }];
}

export default function TrackedAccounts() {
  return <TrackedAccountsPage />;
}
