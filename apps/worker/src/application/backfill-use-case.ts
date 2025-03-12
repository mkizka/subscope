import type { Did } from "@atproto/did";
import type { ITransactionManager, Record } from "@dawn/common/domain";

import type { JobLogger } from "../shared/job.js";
import type { IRepoFetcher } from "./interfaces/repo-fetcher.js";
import type { IndexActorService } from "./service/index-actor-service.js";
import type { IndexCommitService } from "./service/index-commit-service.js";

const BACKFILL_SUPPORTED_COLLECTIONS = ["app.bsky.actor.profile"];

const isBackfillSupported = (record: Record) => {
  return BACKFILL_SUPPORTED_COLLECTIONS.includes(record.collection);
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
