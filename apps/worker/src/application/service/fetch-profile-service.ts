import type { Did } from "@atproto/did";
import type { IJobQueue } from "@dawn/common/domain";

export class FetchProfileService {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule(actorDid: Did): Promise<void> {
    await this.jobQueue.add({
      queueName: "fetchProfile",
      jobName: `at://${actorDid}/app.bsky.actor.profile/self`,
      data: actorDid,
    });
  }
}
