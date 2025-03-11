import { AtUri } from "@atproto/syntax";
import { Record } from "@dawn/common/domain";
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
  const uri = AtUri.make(event.did, event.commit.collection, event.commit.rkey);
  if (event.commit.operation === "delete") {
    return {
      commit: {
        operation: event.commit.operation,
        uri,
      },
      jobLogger,
    };
  }
  return {
    commit: {
      operation: event.commit.operation,
      uri,
      record: Record.fromJson({
        uri,
        cid: event.commit.cid,
        json: event.commit.record,
      }),
    },
    jobLogger,
  };
};

export type IndexCommitCommand = ReturnType<typeof indexCommitCommandFactory>;
