import type { Did } from "@atproto/did";
import { Tap } from "@atproto/tap";

import type { ITapClient } from "../../domain/interfaces/tap-client.js";

export class TapClient implements ITapClient {
  private tap: Tap;

  constructor(tapUrl: string) {
    this.tap = new Tap(tapUrl);
  }

  async addRepo(did: Did): Promise<void> {
    await this.tap.addRepos([did]);
  }

  async removeRepo(did: Did): Promise<void> {
    await this.tap.removeRepos([did]);
  }

  async getRepoState(did: Did): Promise<string> {
    const info = await this.tap.getRepoInfo(did);
    return info.state;
  }
}
