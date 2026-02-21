/* eslint-disable no-console */
import http from "node:http";

import express from "express";
import * as vite from "vite";

import { env } from "@/server/shared/env";

import type { SubscopeServer } from "./subscope";

const app = express();
const server = http.createServer(app);

const viteServer = await vite.createServer({
  server: {
    middlewareMode: { server },
    hmr: { server },
  },
});

app.use(viteServer.middlewares);
app.use(async (req, res, next) => {
  try {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { server } = (await viteServer.ssrLoadModule(
      "./server/bootstrap/server.ts",
    )) as { server: SubscopeServer };
    return await server.app(req, res, next);
  } catch (error) {
    if (error instanceof Error) {
      viteServer.ssrFixStacktrace(error);
    }
    next(error);
  }
});

server.listen(env.PORT, () => {
  console.log(`Development server is running at ${env.PUBLIC_URL}`);
});
