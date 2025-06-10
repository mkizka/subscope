import type { Did } from "@atproto/did";
import type { DatabaseClient, ITransactionManager } from "@repo/common/domain";
import { isSupportedCollection } from "@repo/common/utils";

import type { JobLogger } from "../../../shared/job.js";
import type { IRepoFetcher } from "../../interfaces/external/repo-fetcher.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { IndexCommitService } from "../../services/indexer/index-commit-service.js";

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

  async execute({ did, jobLogger }: { did: Did; jobLogger: JobLogger }) {
    await this.actorRepository.updateBackfillStatus({
      ctx: { db: this.db },
      did,
      status: "in-process",
    });

    const repoRecords = await this.repoFetcher.fetch(did, jobLogger);
    const filteredRecords = repoRecords.filter((record) =>
      isSupportedCollection(record.collection),
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
