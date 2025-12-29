import type { Did } from "@atproto/did";

import type { ITapClient } from "../../domain/interfaces/tap-client.js";

export class InMemoryTapClient implements ITapClient {
  private readonly registeredDids = new Set<Did>();

  async addRepo(did: Did): Promise<void> {
    this.registeredDids.add(did);
  }

  async removeRepo(did: Did): Promise<void> {
    this.registeredDids.delete(did);
  }

  getRegisteredDids(): Did[] {
    return Array.from(this.registeredDids);
  }

  clear(): void {
    this.registeredDids.clear();
  }
}
