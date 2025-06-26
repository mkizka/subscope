import type { Did } from "@atproto/did";
import type { CommitEvent, IdentityEvent } from "@skyware/jetstream";
import type { Queue } from "bullmq";

export type JobData = {
  resolveDid: Did;
  fetchRecord: string; // AtUri
  identity: IdentityEvent;
  commit: CommitEvent<string>;
  backfill: Did;
  temp__cleanupDatabase: undefined;
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
