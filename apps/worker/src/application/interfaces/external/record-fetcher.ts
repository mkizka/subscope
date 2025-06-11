import type { AtUri } from "@atproto/syntax";
import type { Record } from "@repo/common/domain";

export interface IRecordFetcher {
  fetch: (uri: AtUri) => Promise<Record | null>;
}