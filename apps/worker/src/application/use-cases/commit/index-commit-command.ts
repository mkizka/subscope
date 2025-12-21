import { AtUri } from "@atproto/syntax";
import type { CommitEventDto } from "@repo/common/domain";
import { Record } from "@repo/common/domain";

import type { JobLogger } from "../../../shared/job.js";

export const indexCommitCommandFactory = ({
  event,
  jobLogger,
}: {
  event: CommitEventDto;
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
        indexedAt: new Date(),
      }),
    },
    jobLogger,
  };
};

export type IndexCommitCommand = ReturnType<typeof indexCommitCommandFactory>;
