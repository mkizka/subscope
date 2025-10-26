import type { AtUri } from "@atproto/syntax";
import type { IJobQueue } from "@repo/common/domain";

import { env } from "../../../shared/env.js";

export class AggregateStatsScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule(uri: AtUri): Promise<void> {
    const postUri = uri.toString();
    await this.jobQueue.add({
      queueName: "aggregateStats",
      jobName: postUri,
      data: {
        postUri,
      },
      options: {
        jobId: postUri,
        delay: env.AGGREGATE_STATS_DELAY_SECONDS * 1000,
      },
    });
  }
}
