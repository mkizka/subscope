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
}

interface ScheduledAddTapRepo {
  did: Did;
}

interface ScheduledRemoveTapRepo {
  did: Did;
}

interface ScheduledAggregatePostStats {
  uri: AtUri;
  type: JobData["aggregatePostStats"]["type"];
}

interface ScheduledAggregateActorStats {
  did: Did;
  type: JobData["aggregateActorStats"]["type"];
}

export class InMemoryJobScheduler implements IJobScheduler {
  private fetchRecordJobs: ScheduledFetchRecord[] = [];
  private resolveDidJobs: ScheduledResolveDid[] = [];
  private addTapRepoJobs: ScheduledAddTapRepo[] = [];
  private removeTapRepoJobs: ScheduledRemoveTapRepo[] = [];
  private aggregatePostStatsJobs: ScheduledAggregatePostStats[] = [];
  private aggregateActorStatsJobs: ScheduledAggregateActorStats[] = [];

  async scheduleFetchRecord(
    uri: AtUri,
    { live, depth }: { live: boolean; depth: number },
  ): Promise<void> {
    this.fetchRecordJobs.push({ uri, live, depth });
  }

  async scheduleResolveDid(did: Did): Promise<void> {
    this.resolveDidJobs.push({ did });
  }

  async scheduleAddTapRepo(did: Did): Promise<void> {
    this.addTapRepoJobs.push({ did });
  }

  async scheduleRemoveTapRepo(did: Did): Promise<void> {
    this.removeTapRepoJobs.push({ did });
  }

  async scheduleAggregatePostStats(
    uri: AtUri,
    type: JobData["aggregatePostStats"]["type"],
  ): Promise<void> {
    this.aggregatePostStatsJobs.push({ uri, type });
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

  getAddTapRepoJobs(): readonly ScheduledAddTapRepo[] {
    return this.addTapRepoJobs;
  }

  getRemoveTapRepoJobs(): readonly ScheduledRemoveTapRepo[] {
    return this.removeTapRepoJobs;
  }

  getAggregatePostStatsJobs(): readonly ScheduledAggregatePostStats[] {
    return this.aggregatePostStatsJobs;
  }

  getAggregateActorStatsJobs(): readonly ScheduledAggregateActorStats[] {
    return this.aggregateActorStatsJobs;
  }

  clear(): void {
    this.fetchRecordJobs = [];
    this.resolveDidJobs = [];
    this.addTapRepoJobs = [];
    this.removeTapRepoJobs = [];
    this.aggregatePostStatsJobs = [];
    this.aggregateActorStatsJobs = [];
  }
}
