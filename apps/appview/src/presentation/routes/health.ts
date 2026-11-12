import { Router } from "express";

import type { Env } from "../../shared/env.js";

export const healthRouterFactory = ({
  env,
}: {
  env: Pick<Env, "NODE_ENV" | "LOG_LEVEL" | "PORT" | "PUBLIC_URL">;
}): Router => {
  const router = Router();
  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      env: {
        NODE_ENV: env.NODE_ENV,
        LOG_LEVEL: env.LOG_LEVEL,
        PORT: env.PORT,
        PUBLIC_URL: env.PUBLIC_URL,
      },
    });
  });
  return router;
};
