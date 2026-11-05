import { data } from "react-router";

import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { env } from "@/app/server/env";

import type { Route } from "./+types/api.server";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = () => {
  return data({ serviceDid: `${env.APPVIEW_DID}#bsky_appview` });
};
