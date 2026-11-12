import type { Did } from "@atproto/did";
import { Tap } from "@atproto/tap";

import type { ITapClient } from "../../application/interfaces/external/tap-client.js";
import type { Env } from "../../shared/env.js";

export class TapClient implements ITapClient {
  private tap: Tap;

  constructor(env: Pick<Env, "TAP_URL">) {
    this.tap = new Tap(env.TAP_URL);
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
