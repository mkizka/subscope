import { createRequestHandler } from "@react-router/express";
import type { SubscoAgent } from "@repo/client/api";
import express from "express";
import { Router } from "express";

import { env } from "../../shared/env";
import type { OAuthSession } from "../oauth/session";

type AppLoadContextAuth = {
  userDid: string;
  agent: SubscoAgent;
};

declare module "react-router" {
  interface AppLoadContext {
    auth: AppLoadContextAuth | null;
  }
}

const getLoadContext =
  (oauthSession: OAuthSession) =>
  async (
    req: express.Request,
    res: express.Response,
  ): Promise<{
    auth: AppLoadContextAuth | null;
  }> => {
    const agent = await oauthSession.getAgent(req, res);
    if (agent) {
      return {
        auth: {
          userDid: agent.did,
          agent,
        },
      };
    }
    return { auth: null };
  };

export const clientRouterFactory = async (
  oauthSession: OAuthSession,
): Promise<Router> => {
  const router: Router = Router();

  if (env.NODE_ENV === "production") {
    router.use(express.static("build/client"));
    router.use(
      createRequestHandler({
        // @ts-expect-error
        build: () => import("../../../build/server/index.js"),
        getLoadContext: getLoadContext(oauthSession),
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
        getLoadContext: getLoadContext(oauthSession),
      }),
    );
  }

  return router;
};
clientRouterFactory.inject = ["oauthSession"] as const;
