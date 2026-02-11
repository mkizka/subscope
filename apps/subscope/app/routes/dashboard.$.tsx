import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import type { IJobQueue } from "@repo/common/domain";
import { ReactRouterAdapter } from "bull-board-react-router";

import type { Route } from "./+types/dashboard.$";

const handler = (request: Request, jobQueue: IJobQueue) => {
  const serverAdapter = new ReactRouterAdapter();
  serverAdapter.setBasePath("/dashboard");

  createBullBoard({
    queues: jobQueue.getQueues().map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });

  return serverAdapter.handleRequest(request);
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  return handler(request, context.injected.jobQueue);
};

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  return handler(request, context.injected.jobQueue);
};
