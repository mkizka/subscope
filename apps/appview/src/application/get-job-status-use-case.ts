import type { Did } from "@atproto/did";
import type { DevMkizkaTestSyncGetJobStatus } from "@repo/client/server";
import type { IJobQueue } from "@repo/common/domain";

export class GetJobStatusUseCase {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async execute(did: Did): Promise<DevMkizkaTestSyncGetJobStatus.OutputSchema> {
    const state = await this.jobQueue.getJobState({
      queueName: "backfill",
      jobId: did,
    });
    return { state };
  }
}
