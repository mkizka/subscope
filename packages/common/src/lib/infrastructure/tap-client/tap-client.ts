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
}
