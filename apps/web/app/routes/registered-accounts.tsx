import { data } from "react-router";

import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { RegisteredAccountsPage } from "@/app/pages/client/registered-accounts-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/registered-accounts";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async () => {
  return data(await di.getRegisteredAccountsUseCase.execute());
};

export function meta() {
  return [{ title: "登録アカウント - Subscope" }];
}

export default function RegisteredAccounts({
  loaderData,
}: Route.ComponentProps) {
  return <RegisteredAccountsPage {...loaderData} />;
}
