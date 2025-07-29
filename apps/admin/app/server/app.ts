import "react-router";

import { createRequestHandler } from "@react-router/express";
import type { Router } from "express";
import express from "express";

declare module "react-router" {
  interface AppLoadContext {
    VALUE_FROM_EXPRESS: string;
  }
}

export const appFactory = (dashboardRouter: Router): express.Express => {
  const app = express();

  app.use(dashboardRouter);

  app.use(
    createRequestHandler({
      build: () => import("virtual:react-router/server-build"),
      getLoadContext() {
        return {
          VALUE_FROM_EXPRESS: "Hello from Express",
        };
      },
    }),
  );

  return app;
};
appFactory.inject = ["dashboardRouter"] as const;
