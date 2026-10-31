import { data } from "react-router";

import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { MembersPage } from "@/app/pages/client/members-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/members";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async () => {
  return data(await di.getMembersUseCase.execute());
};

export function meta() {
  return [{ title: "メンバー - Subscope" }];
}

export default function Members({ loaderData }: Route.ComponentProps) {
  return <MembersPage {...loaderData} />;
}
