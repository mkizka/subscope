import type { Did } from "@atproto/did";
import type {
  AccountEvent,
  CommitEvent,
  IdentityEvent,
} from "@skyware/jetstream";
import type { Queue } from "bullmq";

import type { SupportedCollection } from "../../utils/collection.js";

type FetchRecordData = {
  uri: string;
  depth: number;
};

type AggregateStatsData = {
  postUri: string;
  type: "reply" | "all";
};

export type JobData = {
  resolveDid: Did;
  fetchRecord: FetchRecordData;
  account: AccountEvent;
  identity: IdentityEvent;
  commit: CommitEvent<SupportedCollection>;
  backfill: Did;
  aggregateStats: AggregateStatsData;
};

export type QueueName = keyof JobData;

export type JobState = "inProgress" | "completed" | "failed";

type JobOptions = {
  jobId?: string;
  delay?: number;
};

export interface IJobQueue {
  getQueues: () => Queue[];
  add: <T extends QueueName>(params: {
    queueName: T;
    jobName: string;
    data: JobData[T];
    options?: JobOptions;
  }) => Promise<void>;
}
