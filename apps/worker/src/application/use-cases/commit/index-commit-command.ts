import type { AtUri } from "@atproto/syntax";

import type { Origin } from "../../dto/origin.js";
import type { Record } from "../../dto/record.js";

export type IndexCommitCommand = {
  commit:
    | { operation: "delete"; uri: AtUri; rev: string }
    | {
        operation: "create" | "update";
        uri: AtUri;
        rev: string;
        record: Record;
      };
  origin: Origin;
};
