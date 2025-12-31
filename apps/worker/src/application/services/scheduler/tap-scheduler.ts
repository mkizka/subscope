import type { Did } from "@atproto/did";
import type { IJobQueue } from "@repo/common/domain";

export class TapScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async scheduleAddRepo(did: Did): Promise<void> {
    await this.jobQueue.add({
      queueName: "addTapRepo",
      jobName: did,
      data: did,
      options: { jobId: did },
    });
  }

  async scheduleRemoveRepo(did: Did): Promise<void> {
    await this.jobQueue.add({
      queueName: "removeTapRepo",
      jobName: did,
      data: did,
      options: { jobId: did },
    });
  }
}
