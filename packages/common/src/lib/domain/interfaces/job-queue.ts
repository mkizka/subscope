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

export type JobData = {
  resolveDid: Did;
  fetchRecord: FetchRecordData;
  account: AccountEvent;
  identity: IdentityEvent;
  commit: CommitEvent<SupportedCollection>;
  backfill: Did;
};

export type QueueName = keyof JobData;

export type JobState = "inProgress" | "completed" | "failed";

export interface IJobQueue {
  getQueues: () => Queue[];
  add: <T extends QueueName>(params: {
    queueName: T;
    jobName: string;
    data: JobData[T];
  }) => Promise<void>;
  getJobState: (params: {
    queueName: QueueName;
    jobId: string;
  }) => Promise<JobState>;
}
