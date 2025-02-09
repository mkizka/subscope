import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { SupportedCollection } from "@dawn/common/utils";
import type { CommitEvent } from "@skyware/jetstream";

export const indexCommitCommandFactory = (
  event: CommitEvent<SupportedCollection>,
) => {
  const base = {
    uri: new AtUri(
      `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
    ),
    did: asDid(event.did),
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
