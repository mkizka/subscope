import { asDid } from "@atproto/did";
import type { CommitCreateEvent, CommitUpdateEvent } from "@skyware/jetstream";

export const upsertPostDtoFactory = (
  event:
    | CommitCreateEvent<"app.bsky.feed.post">
    | CommitUpdateEvent<"app.bsky.feed.post">,
) => {
  return {
    rkey: event.commit.rkey,
    actorDid: asDid(event.did),
    text: event.commit.record.text,
    langs: event.commit.record.langs ?? [],
    createdAt: new Date(event.commit.record.createdAt),
  };
};

export type UpsertPostDto = ReturnType<typeof upsertPostDtoFactory>;
