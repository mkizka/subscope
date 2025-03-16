import type { Did } from "@atproto/did";
import type { ITransactionManager, Record } from "@dawn/common/domain";
import type { SupportedCollection } from "@dawn/common/utils";

import type { JobLogger } from "../shared/job.js";
import type { IRepoFetcher } from "./interfaces/repo-fetcher.js";
import type { IndexActorService } from "./service/index-actor-service.js";
import type { IndexCommitService } from "./service/index-commit-service.js";

const BACKFILL_COLLECTIONS: SupportedCollection[] = [
  "app.bsky.actor.profile",
  "app.bsky.graph.follow",
];

const isBackfillSupported = (record: Record) => {
  return BACKFILL_COLLECTIONS.includes(
    record.collection as SupportedCollection,
  );
};

export class BackfillUseCase {
  constructor(
    private readonly repoFetcher: IRepoFetcher,
    private readonly transactionManager: ITransactionManager,
    private readonly indexActorService: IndexActorService,
    private readonly indexCommitService: IndexCommitService,
  ) {}
  static inject = [
    "repoFetcher",
    "transactionManager",
    "indexActorService",
    "indexCommitService",
  ] as const;

  async execute({ did, jobLogger }: { did: Did; jobLogger: JobLogger }) {
    const repoRecords = await this.repoFetcher.fetch(did);
    const backfillSupportedRecords = repoRecords.filter(isBackfillSupported);
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexActorService.createIfNotExists({ ctx, did });
      for (const record of backfillSupportedRecords) {
        await this.indexCommitService.upsert({ ctx, record, jobLogger });
      }
    });
  }
}
