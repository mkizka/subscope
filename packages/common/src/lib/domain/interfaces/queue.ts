import type { Did } from "@atproto/did";
import type { CommitEvent, IdentityEvent } from "@skyware/jetstream";

type JobData = {
  resolveDid: Did;
  "sync:identity": IdentityEvent;
  "sync:app.bsky.actor.profile": CommitEvent<"app.bsky.actor.profile">;
  "sync:app.bsky.feed.post": CommitEvent<"app.bsky.feed.post">;
};

type QueueName = keyof JobData;

export interface Queue {
  add: <T extends QueueName>(queueName: T, data: JobData[T]) => Promise<void>;
}
