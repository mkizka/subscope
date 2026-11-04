import type { AtUri } from "@atproto/syntax";

import type { Record } from "../../dto/record.js";

export class RecordFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecordFetchError";
  }
}

export interface IRecordFetcher {
  fetch: (uri: AtUri) => Promise<Record>;
}
