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

  private indexRecords = async (records: Record[], jobLogger: JobLogger) => {
    /* eslint-disable no-console */
    console.log("[DEBUG] indexRecords called with", records.length, "records");
    const chunks = chunkArray(records, env.BACKFILL_BATCH_SIZE);
    console.log("[DEBUG] chunks count:", chunks.length);
    for (const [index, chunk] of Object.entries(chunks)) {
      const chunkNumber = Number(index) + 1;
      console.log(
        "[DEBUG] processing chunk",
        chunkNumber,
        "with",
        chunk.length,
        "records",
      );
      await jobLogger.log(
        `Processing other chunk ${chunkNumber}/${chunks.length} (${chunk.length} records)`,
      );

      await this.transactionManager.transaction(async (ctx) => {
        console.log("[DEBUG] inside transaction for chunk", chunkNumber);
        for (const record of chunk) {
          console.log(
            "[DEBUG] calling indexRecordService.upsert for",
            record.uri,
          );
          await this.indexRecordService.upsert({
            ctx,
            record,
            jobLogger,
            force: true,
            depth: 0,
          });
          console.log(
            "[DEBUG] indexRecordService.upsert completed for",
            record.uri,
          );
        }
        console.log("[DEBUG] transaction completed for chunk", chunkNumber);
      });
    }
    console.log("[DEBUG] indexRecords completed");
    /* eslint-enable no-console */
  };

  private async doSyncRepo({
    actor,
    jobLogger,
  }: {
    actor: Actor;
    jobLogger: JobLogger;
  }) {
    /* eslint-disable no-console */
    console.log("[DEBUG] doSyncRepo started");
    actor.startSyncRepo();
    console.log("[DEBUG] startSyncRepo called, status:", actor.syncRepoStatus);
    await this.actorRepository.upsert({ ctx: { db: this.db }, actor });
    console.log("[DEBUG] actor upserted after startSyncRepo");

    const repoRecords = await this.repoFetcher.fetch(actor.did, jobLogger);
    console.log("[DEBUG] repoRecords fetched, count:", repoRecords.length);
    const filteredRecords = repoRecords.filter((record) =>
      isSupportedCollection(record.collection),
    );
    console.log("[DEBUG] filteredRecords count:", filteredRecords.length);
    const followRecords = filteredRecords.filter(
      (record) => record.collection === "app.bsky.graph.follow",
    );
    const otherRecords = filteredRecords.filter(
      (record) => record.collection !== "app.bsky.graph.follow",
    );
    console.log(
      "[DEBUG] followRecords:",
      followRecords.length,
      "otherRecords:",
      otherRecords.length,
    );

    console.log("[DEBUG] calling indexRecords for followRecords");
    await this.indexRecords(followRecords, jobLogger);
    console.log("[DEBUG] followRecords indexed");
    actor.markSyncRepoReady();
    await this.actorRepository.upsert({ ctx: { db: this.db }, actor });
    await jobLogger.log(
      `Follow records sync completed for actor: ${actor.did}`,
    );

    console.log("[DEBUG] calling indexRecords for otherRecords");
    await this.indexRecords(otherRecords, jobLogger);
    console.log("[DEBUG] otherRecords indexed");
    actor.completeSyncRepo();
    await this.actorRepository.upsert({ ctx: { db: this.db }, actor });
    await jobLogger.log(`Repository sync completed for actor: ${actor.did}`);
    console.log("[DEBUG] doSyncRepo completed");
    /* eslint-enable no-console */
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
      actor.failSyncRepo();
      await this.actorRepository.upsert({ ctx: { db: this.db }, actor });
      throw error;
    }
  }
}
