import express from "express";
import { Router } from "express";
import path from "path";

import { env } from "../../shared/env";

const router = Router();

if (env.NODE_ENV === "production") {
  const distPath = path.resolve(import.meta.dirname, "../../dist");
  router.use(express.static(distPath));
  router.get("*all", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
  });
  router.use(vite.middlewares);
}

export { router as clientRouter };
