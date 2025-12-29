import type { AtUri } from "@atproto/syntax";
import type { IJobQueue } from "@repo/common/domain";

import type { IndexingContext } from "../../interfaces/services/index-collection-service.js";

export class FetchRecordScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule(uri: AtUri, indexingCtx: IndexingContext): Promise<void> {
    const uriString = uri.toString();
    await this.jobQueue.add({
      queueName: "fetchRecord",
      jobName: uriString,
      data: {
        uri: uriString,
        depth: indexingCtx.depth,
        live: indexingCtx.live,
      },
      options: {
        jobId: uriString,
        priority: indexingCtx.live ? undefined : 1,
      },
    });
  }
}
