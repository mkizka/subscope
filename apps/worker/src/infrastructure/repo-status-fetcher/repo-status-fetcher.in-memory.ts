import type { Did } from "@atproto/did";

import type { IRepoStatusFetcher } from "../../application/interfaces/external/repo-status-fetcher.js";

export class InMemoryRepoStatusFetcher implements IRepoStatusFetcher {
  private readonly deletedDids = new Set<Did>();

  async isDeleted(did: Did): Promise<boolean> {
    return this.deletedDids.has(did);
  }

  setDeleted(did: Did): void {
    this.deletedDids.add(did);
  }
}
