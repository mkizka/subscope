import type { Did } from "@atproto/did";
import type { Record } from "@repo/common/domain";

import type { IRepoFetcher } from "../../../application/interfaces/external/repo-fetcher.js";

export class InMemoryRepoFetcher implements IRepoFetcher {
  private results: Map<Did, Record[]> = new Map();

  setFetchResult(did: Did, records: Record[]): void {
    this.results.set(did, records);
  }

  clear(): void {
    this.results.clear();
  }

  async fetch(did: Did): Promise<Record[]> {
    const result = this.results.get(did);
    if (!result) {
      throw new Error(`No fetch result set for DID: ${did}`);
    }
    return result;
  }
}
