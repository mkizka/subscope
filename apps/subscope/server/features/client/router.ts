import { createRequestHandler } from "@react-router/express";
import type { IJobQueue, ILoggerManager } from "@repo/common/domain";
import express from "express";
import { Router } from "express";
import { RouterContextProvider } from "react-router";

import { expressContext } from "@/app/context/express.js";
import { env } from "@/server/shared/env";

const getLoadContext =
  (jobQueue: IJobQueue, loggerManager: ILoggerManager) => () => {
    const context = new RouterContextProvider();
    context.set(expressContext, {
      injected: { jobQueue, loggerManager },
    });
    return context;
  };

export const clientRouterFactory = (
  jobQueue: IJobQueue,
  loggerManager: ILoggerManager,
): Router => {
  const router: Router = Router();

  if (env.NODE_ENV === "production") {
    router.use(express.static("build/client"));
  }
  router.use(
    createRequestHandler({
      build: () => import("virtual:react-router/server-build"),
      getLoadContext: getLoadContext(jobQueue, loggerManager),
    }),
  );

  return router;
};
clientRouterFactory.inject = ["jobQueue", "loggerManager"] as const;
