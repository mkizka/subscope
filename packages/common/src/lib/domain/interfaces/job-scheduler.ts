import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { JobData } from "./job-queue.js";

export interface IJobScheduler {
  scheduleFetchRecord: (
    uri: AtUri,
    options: { live: boolean; depth: number },
  ) => Promise<void>;
  scheduleResolveDid: (did: Did, options: { live: boolean }) => Promise<void>;
  scheduleSyncTapRepo: (did: Did) => Promise<void>;
  scheduleCheckBackfill: (did: Did, attempt: number) => Promise<void>;
  scheduleAggregatePostStats: (uri: AtUri) => Promise<void>;
  scheduleAggregateActorStats: (
    did: Did,
    type: JobData["aggregateActorStats"]["type"],
  ) => Promise<void>;
}
