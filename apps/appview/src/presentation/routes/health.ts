import { Router } from "express";

type HealthEnv = {
  NODE_ENV: string;
  LOG_LEVEL: string;
  PORT: number;
  PUBLIC_URL: string;
};

export const healthRouterFactory = (env: HealthEnv): Router => {
  const router = Router();
  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      env,
    });
  });
  return router;
};
