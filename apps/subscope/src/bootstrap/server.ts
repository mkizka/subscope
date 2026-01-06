import type { RequestHandler } from "express";
import express from "express";

import { env } from "../shared/env.js";

export class SubscopeServer {
  private app;

  constructor(
    authMiddleware: RequestHandler,
    dashboardRouter: express.Router,
    oauthRouter: express.Router,
    clientRouter: express.Router,
  ) {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use("/oauth", oauthRouter);
    app.use("/dashboard", authMiddleware, dashboardRouter);
    app.use(clientRouter);

    this.app = app;
  }
  static inject = [
    "authMiddleware",
    "dashboardRouter",
    "oauthRouter",
    "clientRouter",
  ] as const;

  start() {
    this.app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Subscope server running at http://localhost:${env.PORT}`);
    });
  }
}
