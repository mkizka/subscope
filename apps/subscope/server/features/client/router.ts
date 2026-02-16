import type { IJobQueue } from "@repo/common/domain";
import express from "express";
import { Router } from "express";

import type { OAuthSession } from "@/server/features/oauth/session";
import { env } from "@/server/shared/env";

import { createHandler } from "./handler";

type HandlerModule = {
  createHandler: typeof createHandler;
};

export const clientRouterFactory = async (
  oauthSession: OAuthSession,
  jobQueue: IJobQueue,
): Promise<Router> => {
  const router: Router = Router();

  if (env.NODE_ENV === "production") {
    router.use(express.static("build/client"));
    router.use(createHandler(oauthSession, jobQueue));
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
