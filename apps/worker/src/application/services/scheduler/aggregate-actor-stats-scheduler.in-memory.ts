import type { Did } from "@atproto/did";
import type { JobData } from "@repo/common/domain";

interface ScheduledJob {
  did: Did;
  type: JobData["aggregateActorStats"]["type"];
}

export class InMemoryAggregateActorStatsScheduler {
  private scheduledJobs: ScheduledJob[] = [];

  async schedule(
    did: Did,
    type: JobData["aggregateActorStats"]["type"],
  ): Promise<void> {
    this.scheduledJobs.push({ did, type });
  }

  clear(): void {
    this.scheduledJobs = [];
  }

  getScheduledJobs(): ScheduledJob[] {
    return [...this.scheduledJobs];
  }

  hasScheduledJob(
    did: Did,
    type: JobData["aggregateActorStats"]["type"],
  ): boolean {
    return this.scheduledJobs.some(
      (job) => job.did === did && job.type === type,
    );
  }
}
