import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { JobData } from "./job-queue.js";

export interface IJobScheduler {
  scheduleFetchRecord: (
    uri: AtUri,
    options: { live: boolean; depth: number },
  ) => Promise<void>;
  scheduleResolveDid: (did: Did) => Promise<void>;
  scheduleAddTapRepo: (did: Did) => Promise<void>;
  scheduleRemoveTapRepo: (did: Did) => Promise<void>;
  scheduleAggregatePostStats: (
    uri: AtUri,
    type: JobData["aggregatePostStats"]["type"],
  ) => Promise<void>;
  scheduleAggregateActorStats: (
    did: Did,
    type: JobData["aggregateActorStats"]["type"],
  ) => Promise<void>;
}
