import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ReactRouterAdapter } from "bull-board-react-router";

import { jobQueue } from "@/app/lib/job-queue.server";

import type { Route } from "./+types/admin.bull-board.$";

// jobQueueの参照をloader/action経由のみにしてクライアントバンドルから除外するため、トップレベルではなくlazy initで初期化する
let serverAdapter: ReactRouterAdapter | undefined;

const getServerAdapter = () => {
  if (!serverAdapter) {
    serverAdapter = new ReactRouterAdapter();
    serverAdapter.setBasePath("/admin/bull-board");
    createBullBoard({
      queues: jobQueue.getQueues().map((queue) => new BullMQAdapter(queue)),
      serverAdapter,
    });
  }
  return serverAdapter;
};

export const action = ({ request }: Route.ActionArgs) => {
  return getServerAdapter().handleRequest(request);
};

export const loader = ({ request }: Route.LoaderArgs) => {
  return getServerAdapter().handleRequest(request);
};
