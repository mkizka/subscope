import type { Did } from "@atproto/did";
import type { CommitEvent, IdentityEvent } from "@skyware/jetstream";
import type { Queue } from "bullmq";

export type JobData = {
  resolveDid: Did;
  identity: IdentityEvent;
  "app.bsky.actor.profile": CommitEvent<"app.bsky.actor.profile">;
  "app.bsky.feed.post": CommitEvent<"app.bsky.feed.post">;
};

export type QueueName = keyof JobData;

export interface IJobQueue {
  getQueues: () => Queue[];
  add: <T extends QueueName>(queueName: T, data: JobData[T]) => Promise<void>;
}
