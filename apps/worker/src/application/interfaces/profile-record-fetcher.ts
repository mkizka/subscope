import type { Did } from "@atproto/did";
import type { Record } from "@dawn/common/domain";

export interface IProfileRecordFetcher {
  fetch: (did: Did) => Promise<Record | null>;
}
