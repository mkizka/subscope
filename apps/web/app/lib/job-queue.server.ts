import { JobQueue } from "@repo/common/infrastructure";

import { env } from "@/app/shared/env.js";

export const jobQueue = new JobQueue(env.REDIS_URL);
