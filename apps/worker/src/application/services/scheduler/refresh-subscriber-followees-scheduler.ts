import type { IJobQueue } from "@repo/common/domain";

export class RefreshSubscriberFolloweesScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule(): Promise<void> {
    await this.jobQueue.add({
      queueName: "refreshSubscriberFollowees",
      jobName: "refresh-subscriber-followees",
      data: undefined,
      options: {
        jobId: "refresh-subscriber-followees",
        delay: 10000,
      },
    });
  }
}
