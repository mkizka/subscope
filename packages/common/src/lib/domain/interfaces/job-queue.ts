import type { Did } from "@atproto/did";
import type { Queue } from "bullmq";

import type { CommitEventDto, IdentityEventDto } from "../dtos/event.js";

type FetchRecordData = {
  uri: string;
  depth: number;
  live: boolean;
};

type AggregatePostStatsData = {
  uri: string;
  type: "reply" | "repost" | "quote" | "like" | "all";
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
  identity: IdentityEventDto;
  commit: CommitEventDto;
  aggregatePostStats: AggregatePostStatsData;
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
}
