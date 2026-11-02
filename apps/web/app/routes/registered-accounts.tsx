import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { RegisteredAccountsPage } from "@/app/pages/client/registered-accounts-page";

import type { Route } from "./+types/registered-accounts";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta() {
  return [{ title: "登録アカウント - Subscope" }];
}

export default function RegisteredAccounts() {
  return <RegisteredAccountsPage />;
}
