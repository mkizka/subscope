import type { Did } from "@atproto/did";
import type { IJobQueue } from "@repo/common/domain";

export class ResolveDidScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule(did: Did): Promise<void> {
    const jobName = `at://${did}`;
    await this.jobQueue.add({
      queueName: "resolveDid",
      jobName,
      data: did,
      options: {
        jobId: jobName,
      },
    });
  }
}
