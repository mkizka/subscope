import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
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
    // for record
    record: {
      uri: new AtUri(
        `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      ),
      cid: event.commit.cid,
      actorDid: asDid(event.did),
      json: event.commit.record,
    },
  };
};

export type UpsertPostDto = ReturnType<typeof upsertPostDtoFactory>;
