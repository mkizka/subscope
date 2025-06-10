import type { Did } from "@atproto/did";
import type { Record } from "@repo/common/domain";

export interface IProfileRecordFetcher {
  fetch: (did: Did) => Promise<Record | null>;
}
