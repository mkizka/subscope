import type { AtUri } from "@atproto/syntax";
import type { Record } from "@repo/common/domain";

export class RecordFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecordFetchError";
  }
}

export interface IRecordFetcher {
  fetch: (uri: AtUri) => Promise<Record>;
}
