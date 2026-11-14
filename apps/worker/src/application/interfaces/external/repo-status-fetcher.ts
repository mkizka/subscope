import type { Did } from "@atproto/did";

export interface IRepoStatusFetcher {
  isDeleted: (did: Did) => Promise<boolean>;
}
