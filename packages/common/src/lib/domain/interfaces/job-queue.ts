import type { Did } from "@atproto/did";
import type { Queue } from "bullmq";

type FetchRecordData = {
  uri: string;
  depth: number;
  live: boolean;
};

type AggregateActorStatsData = {
  did: Did;
  type: "follows" | "followers" | "posts";
};

type LabelData = {
  src: string;
  uri: string;
  cid?: string;
  val: string;
  neg?: boolean;
  cts: string;
  exp?: string;
};

export type JobData = {
  resolveDid: Did;
  fetchRecord: FetchRecordData;
  aggregatePostStats: null;
  aggregateActorStats: AggregateActorStatsData;
  syncTapRepo: Did;
  label: LabelData;
};

export type QueueName = keyof JobData;

export type JobState = "inProgress" | "completed" | "failed";

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
