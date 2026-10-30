import type { CommitEventDto } from "@repo/common/domain";
import { Queue, QueueEvents } from "bullmq";

import { env } from "@/app/shared/env.js";

const connection = { url: env.REDIS_URL };
const queue = new Queue("commit", { connection });
const queueEvents = new QueueEvents("commit", { connection });

export const indexCommit = async (dto: CommitEventDto) => {
  const job = await queue.add(
    `at://${dto.did}/${dto.commit.collection}/${dto.commit.rkey}`,
    dto,
    { removeOnComplete: { age: 10 }, removeOnFail: { age: 24 * 60 * 60 } },
  );
  await job.waitUntilFinished(queueEvents, 5000);
};
