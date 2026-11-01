import type { AtUri } from "@atproto/syntax";
import type { Record } from "@repo/common/domain";

import type { JobLogger } from "../../../shared/job.js";

export type IndexCommitCommand = {
  commit:
    | { operation: "delete"; uri: AtUri; rev: string }
    | {
        operation: "create" | "update";
        uri: AtUri;
        rev: string;
        record: Record;
      };
  live: boolean;
  jobLogger: JobLogger;
};
