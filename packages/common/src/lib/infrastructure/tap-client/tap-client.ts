import type { Did } from "@atproto/did";
import { Tap } from "@atproto/tap";

import type { ITapClient } from "../../domain/interfaces/tap-client.js";

export class TapClient implements ITapClient {
  private tap: Tap;

  constructor(tapUrl: string) {
    this.tap = new Tap(tapUrl);
  }
  static inject = ["tapUrl"] as const;

  async addRepo(did: Did): Promise<void> {
    await this.tap.addRepos([did]);
  }
}
