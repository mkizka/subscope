import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import type { IJobQueue } from "@repo/common/domain";
import { Router } from "express";

export const dashboardRouterFactory = (jobQueue: IJobQueue): Router => {
  const dashboardRouter = Router();

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/dashboard");

  createBullBoard({
    queues: jobQueue.getQueues().map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });

  dashboardRouter.use(serverAdapter.getRouter());
  return dashboardRouter;
};
dashboardRouterFactory.inject = ["jobQueue"] as const;
