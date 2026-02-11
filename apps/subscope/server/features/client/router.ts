import { createRequestHandler } from "@react-router/express";
import type { SubscoAgent } from "@repo/client/api";
import type { IJobQueue } from "@repo/common/domain";
import express from "express";
import { Router } from "express";

import type { OAuthSession } from "@/server/features/oauth/session";
import { env } from "@/server/shared/env";

type AppLoadContextAuth = {
  userDid: string;
  agent: SubscoAgent;
};

type AppLoadContextInjected = {
  jobQueue: IJobQueue;
};

declare module "react-router" {
  interface AppLoadContext {
    auth: AppLoadContextAuth | null;
    injected: AppLoadContextInjected;
  }
}

const getLoadContext =
  (oauthSession: OAuthSession, jobQueue: IJobQueue) =>
  async (
    req: express.Request,
    res: express.Response,
  ): Promise<{
    auth: AppLoadContextAuth | null;
    injected: AppLoadContextInjected;
  }> => {
    const agent = await oauthSession.getAgent(req, res);
    if (agent) {
      return {
        auth: {
          userDid: agent.did,
          agent,
        },
        injected: {
          jobQueue,
        },
      };
    }
    return { auth: null, injected: { jobQueue } };
  };

export const clientRouterFactory = async (
  oauthSession: OAuthSession,
  jobQueue: IJobQueue,
): Promise<Router> => {
  const router: Router = Router();

  if (env.NODE_ENV === "production") {
    router.use(express.static("build/client"));
    router.use(
      createRequestHandler({
        // @ts-expect-error
        build: () => import("../../../build/server/index.js"),
        getLoadContext: getLoadContext(oauthSession, jobQueue),
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
        getLoadContext: getLoadContext(oauthSession, jobQueue),
      }),
    );
  }

  return router;
};
clientRouterFactory.inject = ["oauthSession", "jobQueue"] as const;
