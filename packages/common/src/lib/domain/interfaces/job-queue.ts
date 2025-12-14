import type { Did } from "@atproto/did";
import type { Queue } from "bullmq";

import type { CommitEventDto, IdentityEventDto } from "../dtos/event.js";

type FetchRecordData = {
  uri: string;
  depth: number;
};

type AggregatePostStatsData = {
  uri: string;
  type: "reply" | "repost" | "quote" | "like" | "all";
};

type AggregateActorStatsData = {
  did: Did;
  type: "follows" | "followers" | "posts";
};

export type JobData = {
  resolveDid: Did;
  fetchRecord: FetchRecordData;
  identity: IdentityEventDto;
  commit: CommitEventDto;
  syncRepo: Did;
  aggregatePostStats: AggregatePostStatsData;
  aggregateActorStats: AggregateActorStatsData;
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
