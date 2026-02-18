/* eslint-disable no-console */
import express from "express";

import { env } from "@/server/shared/env";

import type { SubscopeServer } from "./subscope";

const app = express();

const viteDevServer = await import("vite").then((vite) =>
  vite.createServer({
    server: { middlewareMode: true },
  }),
);
app.use(viteDevServer.middlewares);
app.use(async (req, res, next) => {
  try {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { server } = (await viteDevServer.ssrLoadModule(
      "./server/bootstrap/server.ts",
    )) as { server: SubscopeServer };
    return await server.app(req, res, next);
  } catch (error) {
    if (typeof error === "object" && error instanceof Error) {
      viteDevServer.ssrFixStacktrace(error);
    }
    next(error);
  }
});

app.listen(env.PORT, () => {
  console.log(`Development server is running at ${env.PUBLIC_URL}`);
});
