import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { IJobQueue, JobData } from "../../domain/interfaces/job-queue.js";
import type { IJobScheduler } from "../../domain/interfaces/job-scheduler.js";

const AGGREGATE_STATS_DELAY_MS = 10 * 1000;

const CHECK_BACKFILL_DELAYS_MS = [
  0,
  10 * 1000,
  60 * 1000,
  5 * 60 * 1000,
  10 * 60 * 1000,
];

export class JobScheduler implements IJobScheduler {
  constructor(private readonly jobQueue: IJobQueue) {}

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

  async scheduleResolveDid(
    did: Did,
    { live }: { live: boolean },
  ): Promise<void> {
    const jobName = `at://${did}`;
    await this.jobQueue.add({
      queueName: "resolveDid",
      jobName,
      data: did,
      options: {
        jobId: jobName,
        priority: live ? undefined : 1,
      },
    });
  }

  async scheduleSyncTapRepo(did: Did): Promise<void> {
    await this.jobQueue.add({
      queueName: "syncTapRepo",
      jobName: did,
      data: did,
    });
  }

  async scheduleCheckBackfill(did: Did, attempt: number): Promise<void> {
    await this.jobQueue.add({
      queueName: "checkBackfill",
      jobName: did,
      data: { did, attempt },
      options: {
        deduplication: { id: did, keepLastIfActive: true },
        delay:
          CHECK_BACKFILL_DELAYS_MS[attempt] ?? CHECK_BACKFILL_DELAYS_MS.at(-1),
      },
    });
  }

  async scheduleAggregatePostStats(uri: AtUri): Promise<void> {
    await this.jobQueue.addBatchItems({
      queueName: "aggregatePostStats",
      items: [uri.toString()],
      options: { delay: AGGREGATE_STATS_DELAY_MS },
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
        deduplication: { id: `${type}__${did}`, keepLastIfActive: true },
        delay: AGGREGATE_STATS_DELAY_MS,
      },
    });
  }
}
