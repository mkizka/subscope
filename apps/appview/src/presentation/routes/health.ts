import { Router } from "express";

export const healthRouterFactory = (
  nodeEnv: string,
  logLevel: string,
  port: number,
  publicUrl: string,
) => {
  const healthRouter = Router();
  healthRouter.get("/health", (_req, res) => {
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
  return healthRouter;
};
healthRouterFactory.inject = [
  "nodeEnv",
  "logLevel",
  "port",
  "publicUrl",
] as const;
