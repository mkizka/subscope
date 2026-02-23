import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import type { IJobQueue } from "@repo/common/domain";
import { ReactRouterAdapter } from "bull-board-react-router";

import { expressContext } from "@/app/context/express";

import type { Route } from "./+types/admin.bull-board.$";

const handler = (request: Request, jobQueue: IJobQueue) => {
  const serverAdapter = new ReactRouterAdapter();
  serverAdapter.setBasePath("/admin/bull-board");

  createBullBoard({
    queues: jobQueue.getQueues().map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });

  return serverAdapter.handleRequest(request);
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const server = context.get(expressContext);
  return handler(request, server.injected.jobQueue);
};

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const server = context.get(expressContext);
  return handler(request, server.injected.jobQueue);
};
