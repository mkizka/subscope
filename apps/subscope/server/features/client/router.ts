import { createRequestHandler } from "@react-router/express";
import type { IJobQueue } from "@repo/common/domain";
import express from "express";
import { Router } from "express";
import { RouterContextProvider } from "react-router";

import { expressContext } from "@/app/context/express.js";
import type { OAuthSession } from "@/server/features/oauth/session";
import { env } from "@/server/shared/env";

const getLoadContext =
  (oauthSession: OAuthSession, jobQueue: IJobQueue) =>
  async (req: express.Request, res: express.Response) => {
    const agent = await oauthSession.getAgent(req, res);
    const context = new RouterContextProvider();
    context.set(expressContext, {
      agent,
      injected: { jobQueue },
    });
    return context;
  };

export const clientRouterFactory = (
  oauthSession: OAuthSession,
  jobQueue: IJobQueue,
): Router => {
  const router: Router = Router();

  if (env.NODE_ENV === "production") {
    router.use(express.static("build/client"));
  }
  router.use(
    createRequestHandler({
      build: () => import("virtual:react-router/server-build"),
      getLoadContext: getLoadContext(oauthSession, jobQueue),
    }),
  );

  return router;
};
clientRouterFactory.inject = ["oauthSession", "jobQueue"] as const;
