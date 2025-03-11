import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { SupportedCollection } from "@dawn/common/utils";
import type { CommitEvent } from "@skyware/jetstream";

import type { JobLogger } from "../shared/job.js";

export const indexCommitCommandFactory = ({
  event,
  jobLogger,
}: {
  event: CommitEvent<SupportedCollection>;
  jobLogger: JobLogger;
}) => {
  const base = {
    uri: new AtUri(
      `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
    ),
    did: asDid(event.did),
    collection: event.commit.collection,
  };
  if (event.commit.operation === "delete") {
    return {
      commit: {
        ...base,
        operation: event.commit.operation,
      },
      jobLogger,
    };
  }
  return {
    commit: {
      ...base,
      operation: event.commit.operation,
      cid: event.commit.cid,
      record: event.commit.record,
    },
    jobLogger,
  };
};

export type IndexCommitCommand = ReturnType<typeof indexCommitCommandFactory>;
