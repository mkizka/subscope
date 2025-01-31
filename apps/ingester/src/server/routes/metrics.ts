import type { IJobQueue } from "@dawn/common/domain";
import { Router } from "express";

export const metricsRouterFactory = (jobQueue: IJobQueue) => {
  const metricsRouter = Router();
  metricsRouter.get("/metrics", async (_, res) => {
    const metrics = await Promise.all(
      jobQueue.getQueues().map((queue) => queue.exportPrometheusMetrics()),
    );
    res.set("Content-Type", "text/plain");
    res.send(metrics.join("\n\n"));
  });
  return metricsRouter;
};
metricsRouterFactory.inject = ["jobQueue"] as const;
