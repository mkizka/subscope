import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

export interface IJobScheduler {
  scheduleFetchRecord: (
    uri: AtUri,
    options: { hop: number; live: boolean },
  ) => Promise<void>;
  scheduleResolveDid: (did: Did, options: { live: boolean }) => Promise<void>;
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
