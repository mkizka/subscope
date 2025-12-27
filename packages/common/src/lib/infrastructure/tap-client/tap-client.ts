import { TapClient as AtcuteTapClient } from "@atcute/tap";
import type { Did } from "@atproto/did";

import type { ITapClient } from "../../domain/interfaces/tap-client.js";

export class TapClient implements ITapClient {
  private tap: AtcuteTapClient;

  constructor(tapUrl: string) {
    this.tap = new AtcuteTapClient({ url: tapUrl });
  }
  static inject = ["tapUrl"] as const;

  async addRepo(did: Did): Promise<void> {
    await this.tap.addRepos([did]);
  }
}
