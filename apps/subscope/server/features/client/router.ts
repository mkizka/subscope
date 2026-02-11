import { createRequestHandler } from "@react-router/express";
import type { SubscoAgent } from "@repo/client/api";
import express from "express";
import { Router } from "express";

import type { OAuthSession } from "@/server/features/oauth/session";
import { env } from "@/server/shared/env";

type AppLoadContextAuth = {
  userDid: string;
  agent: SubscoAgent;
};

type DashboardHandler = (request: Request) => Promise<Response>;

declare module "react-router" {
  interface AppLoadContext {
    auth: AppLoadContextAuth | null;
    dashboardHandler: DashboardHandler;
  }
}

const getLoadContext =
  (oauthSession: OAuthSession, dashboardHandler: DashboardHandler) =>
  async (
    req: express.Request,
    res: express.Response,
  ): Promise<{
    auth: AppLoadContextAuth | null;
    dashboardHandler: DashboardHandler;
  }> => {
    const agent = await oauthSession.getAgent(req, res);
    if (agent) {
      return {
        auth: {
          userDid: agent.did,
          agent,
        },
        dashboardHandler,
      };
    }
    return { auth: null, dashboardHandler };
  };

export const clientRouterFactory = async (
  oauthSession: OAuthSession,
  dashboardHandler: DashboardHandler,
): Promise<Router> => {
  const router: Router = Router();

  if (env.NODE_ENV === "production") {
    router.use(express.static("build/client"));
    router.use(
      createRequestHandler({
        // @ts-expect-error
        build: () => import("../../../build/server/index.js"),
        getLoadContext: getLoadContext(oauthSession, dashboardHandler),
      }),
    );
  } else {
    const viteDevServer = await import("vite").then((vite) =>
      vite.createServer({
        server: { middlewareMode: true },
      }),
    );
    router.use(viteDevServer.middlewares);
    router.use(
      createRequestHandler({
        // @ts-expect-error
        build: () =>
          viteDevServer.ssrLoadModule("virtual:react-router/server-build"),
        getLoadContext: getLoadContext(oauthSession, dashboardHandler),
      }),
    );
  }

  return router;
};
clientRouterFactory.inject = ["oauthSession", "dashboardHandler"] as const;
