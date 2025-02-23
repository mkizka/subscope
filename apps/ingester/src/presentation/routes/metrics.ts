import type { IJobQueue, IMetricReporter } from "@dawn/common/domain";
import { Router } from "express";

export const metricsRouterFactory = (
  jobQueue: IJobQueue,
  metricRepoter: IMetricReporter,
) => {
  const metricsRouter = Router();
  metricsRouter.get("/metrics", async (_, res) => {
    const promises = jobQueue
      .getQueues()
      .map((queue) => queue.exportPrometheusMetrics())
      .concat(metricRepoter.getMetrics());
    const metrics = await Promise.all(promises);
    res.set("Content-Type", "text/plain");
    res.send(metrics.join("\n\n"));
  });
  return metricsRouter;
};
metricsRouterFactory.inject = ["jobQueue", "metricReporter"] as const;
