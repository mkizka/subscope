import { Router } from "express";

import { queues } from "../queue.js";

const metricsRouter = Router();

metricsRouter.get("/metrics", async (_, res) => {
  const metrics = await Promise.all(
    Object.values(queues).map((queue) => queue.exportPrometheusMetrics()),
  ).then((result) => result.join("\n\n"));
  res.set("Content-Type", "text/plain");
  res.send(metrics);
});

export { metricsRouter };
