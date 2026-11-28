import type { Did } from "@atproto/did";
import type { IJobScheduler } from "@repo/common/interface";

import type { ITapClient } from "../interfaces/external/tap-client.js";

export class TapRepoService {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async add(did: Did) {
    await this.tapClient.addRepo(did);
    await this.jobScheduler.scheduleCheckBackfill(did, 0);
  }

  async remove(did: Did) {
    await this.tapClient.removeRepo(did);
  }
}
