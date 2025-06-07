import type { Did } from "@atproto/did";
import type { IJobQueue } from "@dawn/common/domain";

export class BackfillService {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule(did: Did): Promise<void> {
    await this.jobQueue.add({
      queueName: "backfill",
      jobName: `at://${did}`,
      data: did,
    });
  }
}
