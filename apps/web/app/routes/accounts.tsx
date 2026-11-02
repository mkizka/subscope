import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { AccountsPage } from "@/app/pages/client/accounts-page";

import type { Route } from "./+types/accounts";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta() {
  return [{ title: "アカウント - Subscope" }];
}

export default function Accounts() {
  return <AccountsPage />;
}
