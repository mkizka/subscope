import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ReactRouterAdapter } from "bull-board-react-router";

import { jobQueue } from "@/app/lib/job-queue.server";

import type { Route } from "./+types/admin.bull-board.$";

const serverAdapter = new ReactRouterAdapter();
serverAdapter.setBasePath("/admin/bull-board");

createBullBoard({
  queues: jobQueue.getQueues().map((queue) => new BullMQAdapter(queue)),
  serverAdapter,
});

export const action = ({ request }: Route.ActionArgs) => {
  return serverAdapter.handleRequest(request);
};

export const loader = ({ request }: Route.LoaderArgs) => {
  return serverAdapter.handleRequest(request);
};
