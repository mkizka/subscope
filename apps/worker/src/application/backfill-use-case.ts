import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@dawn/common/domain";
import type { SupportedCollection } from "@dawn/common/utils";

import type { JobLogger } from "../shared/job.js";
import type { IRepoFetcher } from "./interfaces/repo-fetcher.js";
import type { IndexCommitService } from "./service/index-commit-service.js";

const BACKFILL_COLLECTIONS: SupportedCollection[] = [
  "app.bsky.actor.profile",
  "app.bsky.graph.follow",
  "app.bsky.feed.post",
];

export class BackfillUseCase {
  constructor(
    private readonly repoFetcher: IRepoFetcher,
    private readonly transactionManager: ITransactionManager,
    private readonly indexCommitService: IndexCommitService,
  ) {}
  static inject = [
    "repoFetcher",
    "transactionManager",
    "indexCommitService",
  ] as const;

  async execute({
    did,
    jobLogger,
    targetCollections = BACKFILL_COLLECTIONS,
  }: {
    did: Did;
    jobLogger: JobLogger;
    targetCollections?: SupportedCollection[];
  }) {
    const repoRecords = await this.repoFetcher.fetch(did);
    const filteredRecords = repoRecords.filter((record) =>
      targetCollections.includes(record.collection as SupportedCollection),
    );
    await this.transactionManager.transaction(async (ctx) => {
      for (const record of filteredRecords) {
        await this.indexCommitService.upsert({ ctx, record, jobLogger });
      }
    });
  }
}
