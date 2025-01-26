import { Router } from "express";

import { env } from "../../shared/env.js";

const healthRouter = Router();

const keyof = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
) => {
  return keys.reduce<Pick<T, K>>((acc, key) => {
    acc[key] = obj[key];
    return acc;
    // @ts-expect-error
  }, {});
};

healthRouter.get("/health", (_, res) => {
  res.json({
    status: "ok",
    env: keyof(env, ["NODE_ENV", "LOG_LEVEL", "PORT"]),
  });
});

export { healthRouter };
