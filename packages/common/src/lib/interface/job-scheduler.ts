import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

export interface IJobScheduler {
  scheduleFetchRecord: (
    uri: AtUri,
    options: { live: boolean; depth: number },
  ) => Promise<void>;
  scheduleResolveDid: (did: Did, options: { live: boolean }) => Promise<void>;
  scheduleSyncTapRepo: (did: Did) => Promise<void>;
  scheduleCheckBackfill: (did: Did, attempt: number) => Promise<void>;
  scheduleAggregatePostStats: (uri: AtUri) => Promise<void>;
  scheduleSendPushNotification: (
    recordUri: AtUri,
    recipientDid: Did,
  ) => Promise<void>;
  scheduleAggregateAccountStats: (did: Did) => Promise<void>;
}
