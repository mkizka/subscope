import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type {
  IJobScheduler,
  JobPriority,
} from "../../interface/job-scheduler.js";

interface ScheduledFetchRecord {
  uri: AtUri;
  hop: number;
  priority: JobPriority;
}

interface ScheduledResolveDid {
  did: Did;
  priority: JobPriority;
}

interface ScheduledSyncTapRepo {
  did: Did;
  refetch?: boolean;
}

interface ScheduledCheckBackfill {
  did: Did;
  attempt: number;
}

interface ScheduledSendPushNotification {
  recordUri: AtUri;
  recipientDid: Did;
}

export class InMemoryJobScheduler implements IJobScheduler {
  private fetchRecordJobs: ScheduledFetchRecord[] = [];
  private resolveDidJobs: ScheduledResolveDid[] = [];
  private syncTapRepoJobs: ScheduledSyncTapRepo[] = [];
  private checkBackfillJobs: ScheduledCheckBackfill[] = [];
  private sendPushNotificationJobs: ScheduledSendPushNotification[] = [];
  private aggregatePostStatsUris: AtUri[] = [];
  private aggregateAccountStatsDids: Did[] = [];

  async scheduleFetchRecord(
    uri: AtUri,
    { hop, priority }: { hop: number; priority: JobPriority },
  ): Promise<void> {
    this.fetchRecordJobs.push({ uri, hop, priority });
  }

  async scheduleResolveDid(
    did: Did,
    { priority }: { priority: JobPriority },
  ): Promise<void> {
    this.resolveDidJobs.push({ did, priority });
  }

  async scheduleSyncTapRepo(
    did: Did,
    options?: { refetch: boolean },
  ): Promise<void> {
    this.syncTapRepoJobs.push({ did, ...options });
  }

  async scheduleCheckBackfill(did: Did, attempt: number): Promise<void> {
    this.checkBackfillJobs.push({ did, attempt });
  }

  async scheduleSendPushNotification(
    recordUri: AtUri,
    recipientDid: Did,
  ): Promise<void> {
    this.sendPushNotificationJobs.push({ recordUri, recipientDid });
  }

  async scheduleAggregatePostStats(uri: AtUri): Promise<void> {
    this.aggregatePostStatsUris.push(uri);
  }

  async scheduleAggregateAccountStats(did: Did): Promise<void> {
    this.aggregateAccountStatsDids.push(did);
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

  getSendPushNotificationJobs(): readonly ScheduledSendPushNotification[] {
    return this.sendPushNotificationJobs;
  }

  getAggregatePostStatsUris(): readonly AtUri[] {
    return this.aggregatePostStatsUris;
  }

  getAggregateAccountStatsDids(): readonly Did[] {
    return this.aggregateAccountStatsDids;
  }

  clear(): void {
    this.fetchRecordJobs = [];
    this.resolveDidJobs = [];
    this.syncTapRepoJobs = [];
    this.checkBackfillJobs = [];
    this.sendPushNotificationJobs = [];
    this.aggregatePostStatsUris = [];
    this.aggregateAccountStatsDids = [];
  }
}
