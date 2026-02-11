import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ReactRouterAdapter } from "@repo/bull-board-react-router";
import type { IJobQueue } from "@repo/common/domain";

export const createDashboardHandler = (jobQueue: IJobQueue) => {
  const serverAdapter = new ReactRouterAdapter();
  serverAdapter.setBasePath("/dashboard");

  createBullBoard({
    queues: jobQueue.getQueues().map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });

  return (request: Request) => serverAdapter.handleRequest(request);
};
createDashboardHandler.inject = ["jobQueue"] as const;
