import "react-router";

import { createRequestHandler } from "@react-router/express";
import type { Router } from "express";
import express from "express";

import { env } from "./env.js";
import { healthRouter } from "./routes/health.js";

declare module "react-router" {
  interface AppLoadContext {
    VALUE_FROM_EXPRESS: string;
  }
}

export const appFactory = (dashboardRouter: Router): express.Express => {
  const app = express();

  // 開発環境でのOAuthログイン時 http://127.0.0.1/oauth/callback にリダイレクトされるので、
  // そこからさらに http://admin.localhost にリダイレクトさせる
  app.use((req, res, next) => {
    if (env.NODE_ENV === "development" && req.hostname === "127.0.0.1") {
      res.redirect(new URL(req.originalUrl, env.PUBLIC_URL).toString());
    } else {
      next();
    }
  });

  app.use(dashboardRouter);
  app.use(healthRouter);

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
