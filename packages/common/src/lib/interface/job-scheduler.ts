import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

export type JobPriority = "high" | "low";

export interface IJobScheduler {
  scheduleFetchRecord: (
    uri: AtUri,
    options: { hop: number; priority: JobPriority },
  ) => Promise<void>;
  scheduleResolveDid: (
    did: Did,
    options: { priority: JobPriority },
  ) => Promise<void>;
  scheduleSyncTapRepo: (
    did: Did,
    options?: { refetch: boolean },
  ) => Promise<void>;
  scheduleCheckBackfill: (did: Did, attempt: number) => Promise<void>;
  scheduleAggregatePostStats: (uri: AtUri) => Promise<void>;
  scheduleSendPushNotification: (
    recordUri: AtUri,
    recipientDid: Did,
  ) => Promise<void>;
  scheduleAggregateAccountStats: (did: Did) => Promise<void>;
}
