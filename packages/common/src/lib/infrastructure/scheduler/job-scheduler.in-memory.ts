import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { IJobScheduler } from "../../interface/job-scheduler.js";

interface ScheduledFetchRecord {
  uri: AtUri;
  live: boolean;
  depth: number;
}

interface ScheduledResolveDid {
  did: Did;
  live: boolean;
}

interface ScheduledSyncAccountKind {
  did: Did;
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
  private syncAccountKindJobs: ScheduledSyncAccountKind[] = [];
  private checkBackfillJobs: ScheduledCheckBackfill[] = [];
  private sendPushNotificationJobs: ScheduledSendPushNotification[] = [];
  private aggregatePostStatsUris: AtUri[] = [];
  private aggregateAccountStatsDids: Did[] = [];

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

  async scheduleSyncAccountKind(did: Did): Promise<void> {
    this.syncAccountKindJobs.push({ did });
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

  getSyncAccountKindJobs(): readonly ScheduledSyncAccountKind[] {
    return this.syncAccountKindJobs;
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
    this.syncAccountKindJobs = [];
    this.checkBackfillJobs = [];
    this.sendPushNotificationJobs = [];
    this.aggregatePostStatsUris = [];
    this.aggregateAccountStatsDids = [];
  }
}
