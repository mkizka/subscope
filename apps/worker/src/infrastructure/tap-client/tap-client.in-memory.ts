import type { Did } from "@atproto/did";

import type { ITapClient } from "../../application/interfaces/external/tap-client.js";

export class InMemoryTapClient implements ITapClient {
  private readonly addedDids = new Set<Did>();
  private readonly repoStates = new Map<Did, string>();

  async addRepo(did: Did): Promise<void> {
    this.addedDids.add(did);
  }

  async removeRepo(did: Did): Promise<void> {
    this.addedDids.delete(did);
  }

  async getRepoState(did: Did): Promise<string> {
    return this.repoStates.get(did) ?? "active";
  }

  setRepoState(did: Did, state: string): void {
    this.repoStates.set(did, state);
  }

  getAddedDids(): Did[] {
    return Array.from(this.addedDids);
  }

  clear(): void {
    this.addedDids.clear();
    this.repoStates.clear();
  }
}
