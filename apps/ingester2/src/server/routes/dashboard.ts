import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import { Router } from "express";

import { queues } from "../queue.js";

const dashboardRouter = Router();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/dashboard");

createBullBoard({
  queues: Object.values(queues).map((queue) => new BullMQAdapter(queue)),
  serverAdapter,
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
dashboardRouter.use("/dashboard", serverAdapter.getRouter());

export { dashboardRouter };
