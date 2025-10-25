import type { Did } from "@atproto/did";
import type { DatabaseClient, ITransactionManager } from "@repo/common/domain";
import { isSupportedCollection } from "@repo/common/utils";

import { env } from "../../../shared/env.js";
import type { JobLogger } from "../../../shared/job.js";
import type { IRepoFetcher } from "../../interfaces/external/repo-fetcher.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { IndexRecordService } from "../../services/index-record-service.js";

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export class BackfillUseCase {
  constructor(
    private readonly repoFetcher: IRepoFetcher,
    private readonly transactionManager: ITransactionManager,
    private readonly indexRecordService: IndexRecordService,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = [
    "repoFetcher",
    "transactionManager",
    "indexRecordService",
    "actorRepository",
    "db",
  ] as const;

  async execute({ did, jobLogger }: { did: Did; jobLogger: JobLogger }) {
    const actor = await this.actorRepository.findByDid({
      ctx: { db: this.db },
      did,
    });
    if (!actor) {
      throw new Error(`Actor not found: ${did}`);
    }
    actor.setBackfillStatus("in-process");
    await this.actorRepository.upsert({
      ctx: { db: this.db },
      actor,
    });

    const repoRecords = await this.repoFetcher.fetch(did, jobLogger);
    const filteredRecords = repoRecords.filter((record) =>
      isSupportedCollection(record.collection),
    );

    const chunks = chunkArray(filteredRecords, env.BACKFILL_BATCH_SIZE);
    for (const [index, chunk] of Object.entries(chunks)) {
      const chunkNumber = Number(index) + 1;
      await jobLogger.log(
        `Processing chunk ${chunkNumber}/${chunks.length} (${chunk.length} records)`,
      );

      await this.transactionManager.transaction(async (ctx) => {
        for (const record of chunk) {
          await this.indexRecordService.upsert({
            ctx,
            record,
            jobLogger,
            force: true,
            depth: 0,
          });
        }
      });
    }

    actor.setBackfillStatus("synchronized");
    await this.actorRepository.upsert({
      ctx: { db: this.db },
      actor,
    });
    await jobLogger.log(`Backfill completed for actor: ${did}`);
  }
}
