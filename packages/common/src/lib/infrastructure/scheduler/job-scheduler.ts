import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { IJobQueue } from "../../domain/interfaces/job-queue.js";

export interface IJobScheduler {
  scheduleFetchRecord: (
    uri: AtUri,
    options: { live: boolean; depth: number },
  ) => Promise<void>;
  scheduleResolveDid: (did: Did) => Promise<void>;
}

export class JobScheduler implements IJobScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async scheduleFetchRecord(
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

  async scheduleResolveDid(did: Did): Promise<void> {
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
