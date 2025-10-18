import type { Did } from "@atproto/did";
import type {
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
    await this.actorRepository.updateBackfillStatus({
      ctx: { db: this.db },
      did,
      status: "in-process",
    });

    const repoRecords = await this.repoFetcher.fetch(did, jobLogger);

    const filteredRecords: Record[] = [];
    let postCount = 0;
    for (const record of repoRecords) {
      if (!isSupportedCollection(record.collection)) {
        continue;
      }
      if (
        record.collection === "app.bsky.feed.post" ||
        record.collection === "app.bsky.feed.repost"
      ) {
        if (
          env.BACKFILL_POST_LIMIT >= 0 &&
          postCount >= env.BACKFILL_POST_LIMIT
        ) {
          continue;
        }
        postCount++;
      }
      filteredRecords.push(record);
    }

    await this.transactionManager.transaction(async (ctx) => {
      for (const record of filteredRecords) {
        await this.indexRecordService.upsert({
          ctx,
          record,
          jobLogger,
          force: true,
          depth: 0,
        });
      }
      await this.actorRepository.updateBackfillStatus({
        ctx,
        did,
        status: "synchronized",
      });
    });
  }
}
