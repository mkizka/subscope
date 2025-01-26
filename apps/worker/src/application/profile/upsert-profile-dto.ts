import { asDid } from "@atproto/did";
import type { CommitCreateEvent, CommitUpdateEvent } from "@skyware/jetstream";

export const upsertProfileDtoFactory = (
  event:
    | CommitCreateEvent<"app.bsky.actor.profile">
    | CommitUpdateEvent<"app.bsky.actor.profile">,
) => {
  return {
    did: asDid(event.did),
    avatar: event.commit.record.avatar
      ? {
          cid: event.commit.record.avatar.ref.$link,
          mimeType: event.commit.record.avatar.mimeType,
          size: event.commit.record.avatar.size,
        }
      : null,
    description: event.commit.record.description ?? null,
    displayName: event.commit.record.displayName ?? null,
    createdAt: event.commit.record.createdAt ?? null,
  };
};

export type UpsertProfileDto = ReturnType<typeof upsertProfileDtoFactory>;
