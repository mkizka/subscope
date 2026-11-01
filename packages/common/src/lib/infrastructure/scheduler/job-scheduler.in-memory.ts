import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { JobData } from "../../domain/interfaces/job-queue.js";
import type { IJobScheduler } from "../../domain/interfaces/job-scheduler.js";

interface ScheduledFetchRecord {
  uri: AtUri;
  live: boolean;
  depth: number;
}

interface ScheduledResolveDid {
  did: Did;
  live: boolean;
}

interface ScheduledSyncTapRepo {
  did: Did;
}

interface ScheduledCheckBackfill {
  did: Did;
  attempt: number;
}

interface ScheduledAggregateActorStats {
  did: Did;
  type: JobData["aggregateActorStats"]["type"];
}

export class InMemoryJobScheduler implements IJobScheduler {
  private fetchRecordJobs: ScheduledFetchRecord[] = [];
  private resolveDidJobs: ScheduledResolveDid[] = [];
  private syncTapRepoJobs: ScheduledSyncTapRepo[] = [];
  private checkBackfillJobs: ScheduledCheckBackfill[] = [];
  private aggregatePostStatsUris: AtUri[] = [];
  private aggregateActorStatsJobs: ScheduledAggregateActorStats[] = [];

  async scheduleFetchRecord(
    uri: AtUri,
    { live, depth }: { live: boolean; depth: number },
  ): Promise<void> {
    this.fetchRecordJobs.push({ uri, live, depth });
  }

  async scheduleResolveDid(
    did: Did,
    { live }: { live: boolean },
  ): Promise<void> {
    this.resolveDidJobs.push({ did, live });
  }

  async scheduleSyncTapRepo(did: Did): Promise<void> {
    this.syncTapRepoJobs.push({ did });
  }

  async scheduleCheckBackfill(did: Did, attempt: number): Promise<void> {
    this.checkBackfillJobs.push({ did, attempt });
  }

  async scheduleAggregatePostStats(uri: AtUri): Promise<void> {
    this.aggregatePostStatsUris.push(uri);
  }

  async scheduleAggregateActorStats(
    did: Did,
    type: JobData["aggregateActorStats"]["type"],
  ): Promise<void> {
    this.aggregateActorStatsJobs.push({ did, type });
  }

  getFetchRecordJobs(): readonly ScheduledFetchRecord[] {
    return this.fetchRecordJobs;
  }

  getResolveDidJobs(): readonly ScheduledResolveDid[] {
    return this.resolveDidJobs;
  }

  getSyncTapRepoJobs(): readonly ScheduledSyncTapRepo[] {
    return this.syncTapRepoJobs;
  }

  getCheckBackfillJobs(): readonly ScheduledCheckBackfill[] {
    return this.checkBackfillJobs;
  }

  getAggregatePostStatsUris(): readonly AtUri[] {
    return this.aggregatePostStatsUris;
  }

  getAggregateActorStatsJobs(): readonly ScheduledAggregateActorStats[] {
    return this.aggregateActorStatsJobs;
  }

  clear(): void {
    this.fetchRecordJobs = [];
    this.resolveDidJobs = [];
    this.syncTapRepoJobs = [];
    this.checkBackfillJobs = [];
    this.aggregatePostStatsUris = [];
    this.aggregateActorStatsJobs = [];
  }
}
