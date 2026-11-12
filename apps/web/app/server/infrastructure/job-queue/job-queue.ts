import { JobQueue } from "@repo/common/infrastructure";
import type { IJobQueue } from "@repo/common/interface";

import type { Env } from "@/app/server/env";

export const jobQueueFactory = ({
  env,
}: {
  env: Pick<Env, "REDIS_URL">;
}): IJobQueue => new JobQueue(env);
