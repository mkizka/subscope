import type { AtUri } from "@atproto/syntax";
import type { IJobQueue } from "@repo/common/domain";

export class FetchRecordScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule(uri: AtUri): Promise<void> {
    const uriString = uri.toString();
    await this.jobQueue.add({
      queueName: "fetchRecord",
      jobName: uriString,
      data: uriString,
    });
  }
}
