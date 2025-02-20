import { type ITransactionManager, Record } from "@dawn/common/domain";
import type { SupportedCollection } from "@dawn/common/utils";

import type { IndexCommitCommand } from "./index-commit-command.js";
import type { IIndexColectionService } from "./interfaces/index-collection-service.js";
import type { IRecordRepository } from "./interfaces/record-repository.js";
import type { IndexActorService } from "./service/index-actor-service.js";
import type { IndexPostService } from "./service/index-post-service.js";
import type { IndexProfileService } from "./service/index-profile-service.js";

type IndexCollectionServiceMap = {
  [key in SupportedCollection]: IIndexColectionService;
};

const isValidRecord = (record: Record) => {
  // Postgresには`\u0000`を含む文字列を保存できないため
  return !JSON.stringify(record.json).includes("\\u0000");
};

export class IndexCommitUseCase {
  private readonly services: IndexCollectionServiceMap;

  constructor(
    private readonly transactionManager: ITransactionManager,
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
    "transactionManager",
    "recordRepository",
    "indexActorService",
    "indexPostService",
    "indexProfileService",
  ] as const;

  async execute(command: IndexCommitCommand) {
    await command.jobLogger.log(command.commit.uri.toString());
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexActorService.createIfNotExists({
        ctx,
        did: command.commit.did,
      });
      const indexService = this.services[command.commit.collection];
      switch (command.commit.operation) {
        case "create":
        case "update": {
          const record = new Record({
            uri: command.commit.uri,
            cid: command.commit.cid,
            json: command.commit.record,
          });
          if (!isValidRecord(record)) {
            await command.jobLogger.log("Invalid record: null character found");
            break;
          }
          await this.recordRepository.upsert({ ctx, record });
          await indexService.upsert({ ctx, record });
          break;
        }
        case "delete": {
          // Related data is also deleted by cascade
          await this.recordRepository.delete({ ctx, uri: command.commit.uri });
          break;
        }
      }
    });
  }
}
