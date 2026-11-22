import type { Did } from "@atproto/did";
import type { Queue } from "bullmq";

import type { JobPriority } from "./job-scheduler.js";

type FetchRecordData = {
  uri: string;
  hop: number;
  priority: JobPriority;
};

type AggregateAccountStatsData = {
  did: Did;
};

type CheckBackfillData = {
  did: Did;
  attempt: number;
};

type SyncTapRepoData = {
  did: Did;
  refetch?: boolean;
};

type SendPushNotificationData = {
  recordUri: string;
  recipientDid: Did;
};

export type JobData = {
  resolveDid: Did;
  fetchRecord: FetchRecordData;
  aggregatePostStats: null;
  aggregateAccountStats: AggregateAccountStatsData;
  syncTapRepo: SyncTapRepoData;
  checkBackfill: CheckBackfillData;
  sendPushNotification: SendPushNotificationData;
};

export type QueueName = keyof JobData;

export type JobOptions = {
  jobId?: string;
  deduplication?: { id: string; keepLastIfActive: boolean };
  delay?: number;
  priority?: number;
};

export interface IJobQueue {
  getQueues: () => Queue[];
  add: <T extends QueueName>(params: {
    queueName: T;
    jobName: string;
    data: JobData[T];
    options?: JobOptions;
  }) => Promise<void>;
  addBatchItems: (params: {
    queueName: QueueName;
    items: string[];
    options?: JobOptions;
  }) => Promise<void>;
  popBatchItems: (queueName: QueueName, count: number) => Promise<string[]>;
}
