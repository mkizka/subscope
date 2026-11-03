import type { Did } from "@atproto/did";

export interface ITapClient {
  addRepo: (did: Did) => Promise<void>;
  removeRepo: (did: Did) => Promise<void>;
  getRepoState: (did: Did) => Promise<string>;
}
