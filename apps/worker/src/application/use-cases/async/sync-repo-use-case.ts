import type { Did } from "@atproto/did";
import type {
  Actor,
  DatabaseClient,
  ITransactionManager,
  Record,
} from "@repo/common/domain";
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

export class SyncRepoUseCase {
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

  private updateSyncRepoStatus = async (
    actor: Actor,
    status: Actor["syncRepoStatus"],
  ) => {
    actor.setSyncRepoStatus(status);
    await this.actorRepository.upsert({
      ctx: { db: this.db },
      actor,
    });
  };

  private indexRecords = async (records: Record[], jobLogger: JobLogger) => {
    const chunks = chunkArray(records, env.SYNC_REPO_BATCH_SIZE);
    for (const [index, chunk] of Object.entries(chunks)) {
      const chunkNumber = Number(index) + 1;
      await jobLogger.log(
        `Processing other chunk ${chunkNumber}/${chunks.length} (${chunk.length} records)`,
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
  };

  private async doSyncRepo({
    actor,
    jobLogger,
  }: {
    actor: Actor;
    jobLogger: JobLogger;
  }) {
    await this.updateSyncRepoStatus(actor, "in-process");

    const repoRecords = await this.repoFetcher.fetch(actor.did, jobLogger);
    const filteredRecords = repoRecords.filter((record) =>
      isSupportedCollection(record.collection),
    );
    const followRecords = filteredRecords.filter(
      (record) => record.collection === "app.bsky.graph.follow",
    );
    const otherRecords = filteredRecords.filter(
      (record) => record.collection !== "app.bsky.graph.follow",
    );

    await this.indexRecords(followRecords, jobLogger);
    await this.updateSyncRepoStatus(actor, "ready");
    await jobLogger.log(
      `Follow records sync completed for actor: ${actor.did}`,
    );

    await this.indexRecords(otherRecords, jobLogger);
    await this.updateSyncRepoStatus(actor, "synchronized");
    await jobLogger.log(`Repository sync completed for actor: ${actor.did}`);
  }

  async execute({ did, jobLogger }: { did: Did; jobLogger: JobLogger }) {
    const actor = await this.actorRepository.findByDid({
      ctx: { db: this.db },
      did,
    });
    if (!actor) {
      throw new Error(`Actor not found: ${did}`);
    }
    try {
      await this.doSyncRepo({ actor, jobLogger });
    } catch (error) {
      await this.updateSyncRepoStatus(actor, "failed");
      throw error;
    }
  }
}
