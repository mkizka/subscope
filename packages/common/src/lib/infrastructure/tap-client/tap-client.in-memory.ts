import type { Did } from "@atproto/did";

import type { ITapClient } from "../../domain/interfaces/tap-client.js";

export class InMemoryTapClient implements ITapClient {
  private readonly registeredDids = new Set<Did>();
  private readonly repoStates = new Map<Did, string>();

  async addRepo(did: Did): Promise<void> {
    this.registeredDids.add(did);
  }

  async removeRepo(did: Did): Promise<void> {
    this.registeredDids.delete(did);
  }

  async getRepoState(did: Did): Promise<string> {
    return this.repoStates.get(did) ?? "active";
  }

  setRepoState(did: Did, state: string): void {
    this.repoStates.set(did, state);
  }

  getRegisteredDids(): Did[] {
    return Array.from(this.registeredDids);
  }

  clear(): void {
    this.registeredDids.clear();
    this.repoStates.clear();
  }
}
