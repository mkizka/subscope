import type { Did } from "@atproto/did";
import type { DatabaseClient, IDidResolver } from "@dawn/common/domain";

import type { IRepoFetcher } from "./interfaces/repo-fetcher.js";
import type { IndexProfileService } from "./service/index-profile-service.js";

export class BackfillUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly didResolver: IDidResolver,
    private readonly repoFetcher: IRepoFetcher,
    private readonly indexProfileService: IndexProfileService,
  ) {}
  static inject = [
    "db",
    "didResolver",
    "repoFetcher",
    "indexProfileService",
  ] as const;

  async execute(did: Did) {
    const { pds } = await this.didResolver.resolve(did);
    const records = await this.repoFetcher.fetch(pds);
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
