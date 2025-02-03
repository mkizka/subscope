import type { Did } from "@atproto/did";
import type { CommitEvent, IdentityEvent } from "@skyware/jetstream";
import type { Queue } from "bullmq";

export type JobData = {
  resolveDid: Did;
  identity: IdentityEvent;
  commit: CommitEvent<string>;
};

export type QueueName = keyof JobData;

export interface IJobQueue {
  getQueues: () => Queue[];
  add: <T extends QueueName>(queueName: T, data: JobData[T]) => Promise<void>;
}
