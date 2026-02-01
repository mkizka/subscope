import { createRequestHandler } from "@react-router/express";
import express from "express";
import { Router } from "express";

import { env } from "../../shared/env";

const router: Router = Router();

if (env.NODE_ENV === "production") {
  router.use(express.static("build/client"));
  router.use(
    createRequestHandler({
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      build: await import("../../../build/server/index.js"),
    }),
  );
} else {
  const viteDevServer = await import("vite").then((vite) =>
    vite.createServer({
      server: { middlewareMode: true },
    }),
  );
  router.use(viteDevServer.middlewares);
  router.use(
    createRequestHandler({
      // @ts-expect-error
      build: () =>
        viteDevServer.ssrLoadModule("virtual:react-router/server-build"),
    }),
  );
}

export { router as clientRouter };
