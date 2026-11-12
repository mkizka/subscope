import { JobQueue } from "@repo/common/infrastructure";
import type { IJobQueue } from "@repo/common/interface";

export const jobQueueFactory = ({
  redisUrl,
}: {
  redisUrl: string;
}): IJobQueue => new JobQueue(redisUrl);
