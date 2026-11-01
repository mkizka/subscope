import { AtUri } from "@atproto/syntax";
import type { CommitEventDto } from "@repo/common/domain";
import { Record } from "@repo/common/domain";

export const indexCommitCommandFactory = (event: CommitEventDto) => {
  const uri = AtUri.make(event.did, event.commit.collection, event.commit.rkey);
  if (event.commit.operation === "delete") {
    return {
      commit: {
        operation: event.commit.operation,
        uri,
        rev: event.commit.rev,
      },
      live: event.live,
    };
  }
  return {
    commit: {
      operation: event.commit.operation,
      uri,
      rev: event.commit.rev,
      record: Record.create({
        uri,
        cid: event.commit.cid,
        json: event.commit.record,
      }),
    },
    live: event.live,
  };
};

export type IndexCommitCommand = ReturnType<typeof indexCommitCommandFactory>;
