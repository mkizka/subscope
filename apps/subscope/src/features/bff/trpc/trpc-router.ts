import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { Router } from "express";

import type { OAuthSession } from "../oauth/session.js";
import { appRouter } from "./app-router.js";
import { createContextFactory } from "./context.js";

export function trpcRouterFactory(oauthSession: OAuthSession): Router {
  const createContext = createContextFactory(oauthSession);

  const router = Router();
  router.use(
    "/",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return router;
}
trpcRouterFactory.inject = ["oauthSession"] as const;
