import { Router } from "express";

import type { Env } from "../../shared/env.js";

export const healthRouterFactory = ({
  env,
}: {
  env: Pick<Env, "NODE_ENV" | "LOG_LEVEL" | "PORT">;
}): Router => {
  const router = Router();
  router.get("/health", (_, res) => {
    res.json({
      status: "ok",
      env: {
        NODE_ENV: env.NODE_ENV,
        LOG_LEVEL: env.LOG_LEVEL,
        PORT: env.PORT,
      },
    });
  });
  return router;
};
