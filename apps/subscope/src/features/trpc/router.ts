import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { Router } from "express";

import { appRouter } from "./app-router.js";
import { createContext } from "./context.js";

const router = Router();

router.use(
  "/",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export { router as trpcRouter };
