import path from "node:path";

import { createRequestHandler } from "@react-router/express";
import type { IJobQueue } from "@repo/common/domain";
import express from "express";
import { Router } from "express";
import type { ServerBuild } from "react-router";
import { RouterContextProvider } from "react-router";

import { expressContext } from "@/app/context/express.js";
import type { OAuthSession } from "@/server/features/oauth/session";
import { env } from "@/server/shared/env";

import type { createHandler } from "./handler";

type HandlerModule = {
  createHandler: typeof createHandler;
};

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

export const clientRouterFactory = async (
  oauthSession: OAuthSession,
  jobQueue: IJobQueue,
): Promise<Router> => {
  const router: Router = Router();

  if (env.NODE_ENV === "production") {
    const serverBuildPath = path.resolve("build/server/index.js");
    router.use(express.static("build/client"));
    router.use(
      createRequestHandler({
        build: () =>
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          import(serverBuildPath) as Promise<ServerBuild>,
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
    router.use(async (req, res, next) => {
      try {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const module = (await viteDevServer.ssrLoadModule(
          "./server/features/client/handler.ts",
        )) as HandlerModule;
        const handler = module.createHandler(oauthSession, jobQueue);
        return await handler(req, res, next);
      } catch (error) {
        if (typeof error === "object" && error instanceof Error) {
          viteDevServer.ssrFixStacktrace(error);
        }
        next(error);
      }
    });
  }

  return router;
};
clientRouterFactory.inject = ["oauthSession", "jobQueue"] as const;
