import express from "express";

import { env } from "../shared/env.js";
import { clientRouter } from "./client.js";

export class SubscopeServer {
  private app;

  constructor(dashboardRouter: express.Router) {
    const app = express();

    app.use("/dashboard", dashboardRouter);
    app.use(clientRouter);

    this.app = app;
  }
  static inject = ["dashboardRouter"] as const;

  start() {
    this.app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Subscope server running at http://localhost:${env.PORT}`);
    });
  }
}
