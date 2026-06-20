import { Router } from "express";

export const healthRouterFactory = (
  nodeEnv: string,
  logLevel: string,
  port: number,
) => {
  const healthRouter = Router();
  healthRouter.get("/health", (_, res) => {
    res.json({
      status: "ok",
      env: {
        NODE_ENV: nodeEnv,
        LOG_LEVEL: logLevel,
        PORT: port,
      },
    });
  });
  return healthRouter;
};
healthRouterFactory.inject = ["nodeEnv", "logLevel", "port"] as const;
