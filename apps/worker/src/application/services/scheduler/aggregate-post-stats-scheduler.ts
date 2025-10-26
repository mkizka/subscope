import type { AtUri } from "@atproto/syntax";
import type { IJobQueue, JobData } from "@repo/common/domain";

import { env } from "../../../shared/env.js";

export class AggregatePostStatsScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule(
    uri: AtUri,
    type: JobData["aggregatePostStats"]["type"],
  ): Promise<void> {
    const postUri = uri.toString();
    await this.jobQueue.add({
      queueName: "aggregatePostStats",
      jobName: postUri,
      data: {
        uri: postUri,
        type,
      },
      options: {
        // delayの間に連続でスケジュールされた場合はIDが重複することで1つにまとめられる
        jobId: `${type}__${postUri}`,
        delay: env.AGGREGATE_STATS_DELAY_SECONDS * 1000,
      },
    });
  }
}
