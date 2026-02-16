import { createRequestHandler } from "@react-router/express";
import type { IJobQueue } from "@repo/common/domain";
import type express from "express";
import { RouterContextProvider } from "react-router";

import { expressContext } from "@/app/context/express.js";
import type { OAuthSession } from "@/server/features/oauth/session";

export const createHandler = (
  oauthSession: OAuthSession,
  jobQueue: IJobQueue,
) => {
  return createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
    getLoadContext: async (req: express.Request, res: express.Response) => {
      const agent = await oauthSession.getAgent(req, res);
      const context = new RouterContextProvider();
      context.set(expressContext, {
        agent,
        injected: { jobQueue },
      });
      return context;
    },
  });
};
