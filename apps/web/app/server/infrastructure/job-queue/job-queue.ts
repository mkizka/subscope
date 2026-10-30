import type { IJobQueue } from "@repo/common/domain";
import { JobQueue } from "@repo/common/infrastructure";

import { env } from "@/app/server/env";

export const jobQueueFactory = (): IJobQueue => new JobQueue(env.REDIS_URL);
