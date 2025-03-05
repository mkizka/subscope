import type { Did } from "@atproto/did";
import type { Record } from "@dawn/common/domain";

export interface IRepoFetcher {
  fetch: (did: Did) => Promise<Record[]>;
}
