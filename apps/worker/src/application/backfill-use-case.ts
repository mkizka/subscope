import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@dawn/common/domain";

import type { IRepoFetcher } from "./interfaces/repo-fetcher.js";
import type { IndexProfileService } from "./service/index-profile-service.js";

export class BackfillUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly repoFetcher: IRepoFetcher,
    private readonly indexProfileService: IndexProfileService,
  ) {}
  static inject = ["db", "repoFetcher", "indexProfileService"] as const;

  async execute(did: Did) {
    const records = await this.repoFetcher.fetch(did);
    for (const record of records) {
      switch (record.uri.collection) {
        case "app.bsky.actor.profile": {
          await this.indexProfileService.upsert({
            ctx: { db: this.db },
            record,
          });
        }
      }
    }
  }
}
