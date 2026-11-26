import type { AtUri } from "@atproto/syntax";

import type { Record } from "../../../domain/record.js";

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
};
