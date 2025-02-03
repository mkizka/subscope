import { AtUri } from "@atproto/syntax";
import type { CommitEvent } from "@skyware/jetstream";

export const indexCommitCommandFactory = (
  event: CommitEvent<"app.bsky.feed.post" | "app.bsky.actor.profile">,
) => {
  const base = {
    uri: new AtUri(
      `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
    ),
    collection: event.commit.collection,
  };
  if (event.commit.operation === "delete") {
    return {
      ...base,
      operation: event.commit.operation,
    };
  }
  return {
    ...base,
    operation: event.commit.operation,
    cid: event.commit.cid,
    record: event.commit.record,
  };
};

export type IndexCommitCommand = ReturnType<typeof indexCommitCommandFactory>;
