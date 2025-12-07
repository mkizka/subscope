import type { Did } from "@atproto/did";
import type { Record } from "@repo/common/domain";

import type { IRepoFetcher } from "../../../application/interfaces/external/repo-fetcher.js";

type FetchResult = { records: Record[] } | { error: Error };

export class InMemoryRepoFetcher implements IRepoFetcher {
  private results: Map<Did, FetchResult> = new Map();

  setFetchResult(did: Did, records: Record[]): void {
    this.results.set(did, { records });
  }

  setFetchError(did: Did, error: Error): void {
    this.results.set(did, { error });
  }

  clear(): void {
    this.results.clear();
  }

  async fetch(did: Did): Promise<Record[]> {
    const result = this.results.get(did);
    if (!result) {
      throw new Error(`No fetch result set for DID: ${did}`);
    }
    if ("error" in result) {
      throw result.error;
    }
    return result.records;
  }
}
