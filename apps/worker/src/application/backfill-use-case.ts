import type { Did } from "@atproto/did";
import type { DatabaseClient, ITransactionManager } from "@dawn/common/domain";
import type { SupportedCollection } from "@dawn/common/utils";

import type { JobLogger } from "../shared/job.js";
import type { IActorRepository } from "./interfaces/actor-repository.js";
import type { IRepoFetcher } from "./interfaces/repo-fetcher.js";
import type { IndexCommitService } from "./service/index-commit-service.js";

export class BackfillUseCase {
  constructor(
    private readonly repoFetcher: IRepoFetcher,
    private readonly transactionManager: ITransactionManager,
    private readonly indexCommitService: IndexCommitService,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = [
    "repoFetcher",
    "transactionManager",
    "indexCommitService",
    "actorRepository",
    "db",
  ] as const;

  async execute({
    did,
    targetCollections,
    jobLogger,
  }: {
    did: Did;
    targetCollections: SupportedCollection[];
    jobLogger: JobLogger;
  }) {
    await this.actorRepository.updateBackfillStatus({
      ctx: { db: this.db },
      did,
      status: "in-process",
    });

    const repoRecords = await this.repoFetcher.fetch(did);
    const filteredRecords = repoRecords.filter((record) =>
      targetCollections.includes(record.collection as SupportedCollection),
    );

    await this.transactionManager.transaction(async (ctx) => {
      for (const record of filteredRecords) {
        await this.indexCommitService.upsert({ ctx, record, jobLogger });
      }
      await this.actorRepository.updateBackfillStatus({
        ctx,
        did,
        status: "synchronized",
      });
    });
  }
}
