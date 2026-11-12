import { data } from "react-router";

import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.server-info";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async () => {
  return data({
    serviceDid: `${di.env.APPVIEW_DID}#bsky_appview`,
    operator: await di.subscopeQuery.findOperator(),
  });
};
