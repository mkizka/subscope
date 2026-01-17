import type { AtUri } from "@atproto/syntax";
import type { IJobQueue } from "@repo/common/domain";

export class FetchRecordScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule(
    uri: AtUri,
    { live, depth }: { live: boolean; depth: number },
  ): Promise<void> {
    const uriString = uri.toString();
    await this.jobQueue.add({
      queueName: "fetchRecord",
      jobName: uriString,
      data: {
        uri: uriString,
        depth,
        live,
      },
      options: {
        jobId: uriString,
        priority: live ? undefined : 1,
      },
    });
  }
}
