import type { Did } from "@atproto/did";
import type { IJobQueue, JobData } from "@repo/common/domain";

import { env } from "../../../shared/env.js";

export class AggregateActorStatsScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule(
    did: Did,
    type: JobData["aggregateActorStats"]["type"],
  ): Promise<void> {
    await this.jobQueue.add({
      queueName: "aggregateActorStats",
      jobName: did,
      data: {
        did,
        type,
      },
      options: {
        jobId: `${type}__${did}`,
        delay: env.AGGREGATE_STATS_DELAY_SECONDS * 1000,
      },
    });
  }
}
