import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { IJobQueue, JobData } from "../../domain/interfaces/job-queue.js";
import type { IJobScheduler } from "../../domain/interfaces/job-scheduler.js";

const AGGREGATE_STATS_DELAY_MS = 10 * 1000;

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

  async scheduleAddTapRepo(did: Did): Promise<void> {
    await this.jobQueue.add({
      queueName: "addTapRepo",
      jobName: did,
      data: did,
      options: { jobId: did },
    });
  }

  async scheduleRemoveTapRepo(did: Did): Promise<void> {
    await this.jobQueue.add({
      queueName: "removeTapRepo",
      jobName: did,
      data: did,
      options: { jobId: did },
    });
  }

  async scheduleAggregatePostStats(
    uri: AtUri,
    type: JobData["aggregatePostStats"]["type"],
  ): Promise<void> {
    const postUri = uri.toString();
    await this.jobQueue.add({
      queueName: "aggregatePostStats",
      jobName: postUri,
      data: {
        uri: postUri,
        type,
      },
      options: {
        jobId: `${type}__${postUri}`,
        delay: AGGREGATE_STATS_DELAY_MS,
      },
    });
  }

  async scheduleAggregateActorStats(
    did: Did,
    type: JobData["aggregateActorStats"]["type"],
  ): Promise<void> {
    await this.jobQueue.add({
      queueName: "aggregateActorStats",
      jobName: did,
      data: {
        did,
        type,
      },
      options: {
        jobId: `${type}__${did}`,
        delay: AGGREGATE_STATS_DELAY_MS,
      },
    });
  }
}
