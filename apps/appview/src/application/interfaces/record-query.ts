import type { AtUri } from "@atproto/syntax";

import type { RecordDto } from "../dto/record-dto.js";

export interface IRecordQuery {
  findRecords: (uris: AtUri[]) => Promise<RecordDto[]>;
}
