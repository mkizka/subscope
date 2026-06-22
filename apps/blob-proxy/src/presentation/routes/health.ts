import { Router } from "express";

type HealthEnv = {
  nodeEnv: string;
  logLevel: string;
  port: number;
};

export const healthRouterFactory = ({
  nodeEnv,
  logLevel,
  port,
}: HealthEnv): Router => {
  const router = Router();
  router.get("/health", (_, res) => {
    res.json({
      status: "ok",
      env: { NODE_ENV: nodeEnv, LOG_LEVEL: logLevel, PORT: port },
    });
  });
  return router;
};
