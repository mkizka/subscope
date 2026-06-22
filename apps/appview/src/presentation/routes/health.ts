import { Router } from "express";

type HealthEnv = {
  nodeEnv: string;
  logLevel: string;
  port: number;
  publicUrl: string;
};

export const healthRouterFactory = ({
  nodeEnv,
  logLevel,
  port,
  publicUrl,
}: HealthEnv): Router => {
  const router = Router();
  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      env: {
        NODE_ENV: nodeEnv,
        LOG_LEVEL: logLevel,
        PORT: port,
        PUBLIC_URL: publicUrl,
      },
    });
  });
  return router;
};
