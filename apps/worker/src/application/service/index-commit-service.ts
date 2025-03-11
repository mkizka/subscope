import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@dawn/common/domain";
import type { Record } from "@dawn/common/domain";
import { type SupportedCollection } from "@dawn/common/utils";

import type { JobLogger } from "../../shared/job.js";
import type { IIndexColectionService } from "../interfaces/index-collection-service.js";
import type { IRecordRepository } from "../interfaces/record-repository.js";
import type { IndexActorService } from "./index-actor-service.js";
import type { IndexPostService } from "./index-post-service.js";
import type { IndexProfileService } from "./index-profile-service.js";

type IndexCollectionServiceMap = {
  [key in SupportedCollection]: IIndexColectionService;
};

const isValidRecord = (record: Record) => {
  // Postgresには`\u0000`を含む文字列を保存できないため
  return !JSON.stringify(record.getJson()).includes("\\u0000");
};

export class IndexCommitService {
  private readonly services: IndexCollectionServiceMap;

  constructor(
    private readonly recordRepository: IRecordRepository,
    private readonly indexActorService: IndexActorService,
    indexPostService: IndexPostService,
    indexProfileService: IndexProfileService,
  ) {
    this.services = {
      "app.bsky.feed.post": indexPostService,
      "app.bsky.actor.profile": indexProfileService,
    };
  }
  static inject = [
    "recordRepository",
    "indexActorService",
    "indexPostService",
    "indexProfileService",
  ] as const;

  async upsert({
    ctx,
    record,
    jobLogger,
  }: {
    ctx: TransactionContext;
    record: Record;
    jobLogger: JobLogger;
  }) {
    await this.indexActorService.createIfNotExists({
      ctx,
      did: record.actorDid,
    });
    if (!isValidRecord(record)) {
      await jobLogger.log("Invalid record: null character found");
      return;
    }
    await this.recordRepository.upsert({ ctx, record });
    await this.services[record.getCollection()].upsert({ ctx, record });
  }

  async delete({ ctx, uri }: { ctx: TransactionContext; uri: AtUri }) {
    await this.recordRepository.delete({ ctx, uri });
  }
}
