import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@dawn/common/domain";

import type { IRepoFetcher } from "./interfaces/repo-fetcher.js";
import type { IndexActorService } from "./service/index-actor-service.js";
import type { IndexProfileService } from "./service/index-profile-service.js";

export class BackfillUseCase {
  constructor(
    private readonly repoFetcher: IRepoFetcher,
    private readonly transactionManager: ITransactionManager,
    private readonly indexActorService: IndexActorService,
    private readonly indexProfileService: IndexProfileService,
  ) {}
  static inject = [
    "repoFetcher",
    "transactionManager",
    "indexActorService",
    "indexProfileService",
  ] as const;

  async execute(did: Did) {
    const records = await this.repoFetcher.fetch(did);
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexActorService.createIfNotExists({ ctx, did });
      for (const record of records) {
        switch (record.uri.collection) {
          case "app.bsky.actor.profile": {
            await this.indexProfileService.upsert({ ctx, record });
          }
        }
      }
    });
  }
}
