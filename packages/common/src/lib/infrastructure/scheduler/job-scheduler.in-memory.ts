import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { IJobScheduler } from "./job-scheduler.js";

interface ScheduledFetchRecord {
  uri: AtUri;
  live: boolean;
  depth: number;
}

interface ScheduledResolveDid {
  did: Did;
}

export class InMemoryJobScheduler implements IJobScheduler {
  private fetchRecordJobs: ScheduledFetchRecord[] = [];
  private resolveDidJobs: ScheduledResolveDid[] = [];

  async scheduleFetchRecord(
    uri: AtUri,
    { live, depth }: { live: boolean; depth: number },
  ): Promise<void> {
    this.fetchRecordJobs.push({ uri, live, depth });
  }

  async scheduleResolveDid(did: Did): Promise<void> {
    this.resolveDidJobs.push({ did });
  }

  getFetchRecordJobs(): readonly ScheduledFetchRecord[] {
    return this.fetchRecordJobs;
  }

  getResolveDidJobs(): readonly ScheduledResolveDid[] {
    return this.resolveDidJobs;
  }

  clear(): void {
    this.fetchRecordJobs = [];
    this.resolveDidJobs = [];
  }
}
